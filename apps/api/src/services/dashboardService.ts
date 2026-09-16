import { User } from '../models/user'
import { BorrowerProfile } from '../models/borrowerProfile'
import { Loan } from '../models/loan'
import { Payment } from '../models/payment'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, s3BucketName } from '../config/s3'

// ─── SALES MODULE ───────────────────────────────────────────────

/**
 * Get leads — borrowers who registered but haven't applied for a loan yet
 */
export async function getLeads() {
  // Find all borrower users
  const borrowers = await User.find({ role: 'BORROWER' }).select('-password').lean()

  // Find borrower IDs that have at least one loan
  const borrowersWithLoans = await Loan.distinct('borrowerId')

  // Filter to only those without loans
  const leads = borrowers.filter(
    (b) => !borrowersWithLoans.some((id) => id.toString() === b._id.toString())
  )

  // Enrich with profile data if available
  const enriched = await Promise.all(
    leads.map(async (lead) => {
      const profile = await BorrowerProfile.findOne({ userId: lead._id }).lean()
      return {
        ...lead,
        profile: profile || null,
      }
    })
  )

  return enriched
}

// ─── SANCTION MODULE ────────────────────────────────────────────

// Converts stored s3://bucket/key to a fresh pre-signed URL
async function toSignedUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null
  try {
    const key = stored.startsWith('s3://') ? stored.split('/').slice(3).join('/') : stored
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: s3BucketName, Key: key }),
      { expiresIn: 7 * 24 * 60 * 60 }
    )
  } catch {
    return null
  }
}

/**
 * Get all loans with status APPLIED (pending sanction review)
 */
export async function getAppliedLoans() {
  const loans = await Loan.find({ status: 'APPLIED' })
    .populate('borrowerId', 'name email')
    .populate('profileId', 'fullName pan monthlySalary employmentMode salarySlipUrl')
    .sort({ createdAt: 1 })
    .lean()

  // Regenerate signed URLs so the sanction team can view salary slips
  return Promise.all(
    loans.map(async (loan) => {
      const profile = loan.profileId as any
      if (profile?.salarySlipUrl) {
        profile.salarySlipUrl = await toSignedUrl(profile.salarySlipUrl)
      }
      return loan
    })
  )
}


/**
 * Approve a loan: APPLIED → SANCTIONED
 */
export async function approveLoan(loanId: string, sanctionedBy: string) {
  const loan = await Loan.findById(loanId)
  if (!loan) throw new Error('Loan not found')
  if (loan.status !== 'APPLIED') {
    throw new Error(`Cannot approve loan with status "${loan.status}". Only APPLIED loans can be approved.`)
  }

  loan.status = 'SANCTIONED'
  loan.sanctionedBy = new (await import('mongoose')).Types.ObjectId(sanctionedBy)
  loan.sanctionedAt = new Date()
  await loan.save()

  return loan
}

/**
 * Reject a loan: APPLIED → REJECTED (requires reason)
 */
export async function rejectLoan(
  loanId: string,
  sanctionedBy: string,
  rejectionReason: string
) {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Rejection reason is required')
  }

  const loan = await Loan.findById(loanId)
  if (!loan) throw new Error('Loan not found')
  if (loan.status !== 'APPLIED') {
    throw new Error(`Cannot reject loan with status "${loan.status}". Only APPLIED loans can be rejected.`)
  }

  loan.status = 'REJECTED'
  loan.rejectionReason = rejectionReason.trim()
  loan.sanctionedBy = new (await import('mongoose')).Types.ObjectId(sanctionedBy)
  loan.sanctionedAt = new Date()
  await loan.save()

  return loan
}

// ─── DISBURSEMENT MODULE ────────────────────────────────────────

/**
 * Get all loans with status SANCTIONED (ready for disbursement)
 */
export async function getSanctionedLoans() {
  return Loan.find({ status: 'SANCTIONED' })
    .populate('borrowerId', 'name email')
    .populate('profileId', 'fullName pan')
    .populate('sanctionedBy', 'name')
    .sort({ sanctionedAt: 1 })
    .lean()
}

/**
 * Disburse a loan: SANCTIONED → DISBURSED
 */
export async function disburseLoan(loanId: string, disbursedBy: string) {
  const loan = await Loan.findById(loanId)
  if (!loan) throw new Error('Loan not found')
  if (loan.status !== 'SANCTIONED') {
    throw new Error(`Cannot disburse loan with status "${loan.status}". Only SANCTIONED loans can be disbursed.`)
  }

  loan.status = 'DISBURSED'
  loan.disbursedBy = new (await import('mongoose')).Types.ObjectId(disbursedBy)
  loan.disbursedAt = new Date()
  await loan.save()

  return loan
}

// ─── COLLECTION MODULE ─────────────────────────────────────────

/**
 * Get all disbursed loans (active loans needing collection)
 */
export async function getDisbursedLoans() {
  return Loan.find({ status: 'DISBURSED' })
    .populate('borrowerId', 'name email')
    .populate('profileId', 'fullName pan')
    .sort({ disbursedAt: 1 })
    .lean()
}

/**
 * Record a payment against a disbursed loan.
 * Auto-closes the loan when total paid >= total repayment.
 */
export async function recordPayment(
  loanId: string,
  recordedBy: string,
  data: { utrNumber: string; amount: number; date: string }
) {
  // 1. Validate inputs
  if (!data.utrNumber || !data.utrNumber.trim()) {
    throw new Error('UTR number is required')
  }
  if (!data.amount || data.amount <= 0) {
    throw new Error('Payment amount must be greater than 0')
  }
  if (!data.date) {
    throw new Error('Payment date is required')
  }

  // 2. Check UTR uniqueness
  const existingPayment = await Payment.findOne({ utrNumber: data.utrNumber.trim() })
  if (existingPayment) {
    throw new Error(`UTR number "${data.utrNumber}" has already been used`)
  }

  // 3. Find the loan
  const loan = await Loan.findById(loanId)
  if (!loan) throw new Error('Loan not found')
  if (loan.status !== 'DISBURSED') {
    throw new Error(`Cannot record payment for loan with status "${loan.status}". Only DISBURSED loans accept payments.`)
  }

  // 4. Validate payment amount doesn't exceed outstanding
  if (data.amount > loan.outstandingBalance) {
    throw new Error(
      `Payment amount (₹${data.amount}) exceeds outstanding balance (₹${loan.outstandingBalance})`
    )
  }

  // 5. Create payment record
  const payment = await Payment.create({
    loanId: loan._id,
    utrNumber: data.utrNumber.trim(),
    amount: data.amount,
    date: new Date(data.date),
    recordedBy,
  })

  // 6. Update loan totals
  loan.amountPaid = parseFloat((loan.amountPaid + data.amount).toFixed(2))
  loan.outstandingBalance = parseFloat(
    (loan.totalRepayment - loan.amountPaid).toFixed(2)
  )

  // 7. Auto-close if fully paid
  if (loan.outstandingBalance <= 0) {
    loan.outstandingBalance = 0
    loan.status = 'CLOSED'
    loan.closedAt = new Date()
  }

  await loan.save()

  return { payment, loan }
}

/**
 * Get all payments for a loan
 */
export async function getLoanPayments(loanId: string) {
  const loan = await Loan.findById(loanId)
  if (!loan) throw new Error('Loan not found')

  const payments = await Payment.find({ loanId })
    .populate('recordedBy', 'name')
    .sort({ date: -1 })
    .lean()

  return {
    loan: {
      id: loan._id,
      totalRepayment: loan.totalRepayment,
      amountPaid: loan.amountPaid,
      outstandingBalance: loan.outstandingBalance,
      status: loan.status,
    },
    payments,
  }
}
