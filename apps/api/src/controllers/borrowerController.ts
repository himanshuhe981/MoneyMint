import type { Request, Response } from 'express'
import * as borrowerService from '../services/borrowerService'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import { s3BucketName, s3Client } from '../config/s3'

/**
 * POST /api/borrower/profile
 * Submit personal details and run BRE
 */
export const submitProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body

    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      return res.status(400).json({
        message: 'All fields are required: fullName, pan, dateOfBirth, monthlySalary, employmentMode',
      })
    }

    const validModes = ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED']
    if (!validModes.includes(employmentMode)) {
      return res.status(400).json({
        message: 'employmentMode must be one of: SALARIED, SELF_EMPLOYED, UNEMPLOYED',
      })
    }

    const { profile, breResult } = await borrowerService.submitProfile(userId, {
      fullName,
      pan,
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      employmentMode,
    })

    if (!breResult.passed) {
      return res.status(200).json({
        message: 'Eligibility check failed',
        breStatus: 'FAILED',
        breErrors: breResult.errors,
        profile,
      })
    }

    res.status(200).json({
      message: 'Profile submitted and eligibility check passed',
      breStatus: 'PASSED',
      profile,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

/**
 * GET /api/borrower/profile
 * Get own profile — converts s3:// key to a presigned HTTPS URL so the
 * borrower can open their salary slip directly in the browser
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const profile = await borrowerService.getProfile(userId)

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please submit your personal details.' })
    }

    // Convert stored s3:// key to a viewable presigned URL
    const profileObj = profile.toObject ? profile.toObject() : { ...profile }
    if (profileObj.salarySlipUrl?.startsWith('s3://')) {
      const key = profileObj.salarySlipUrl.split('/').slice(3).join('/')
      profileObj.salarySlipUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: s3BucketName, Key: key }),
        { expiresIn: 7 * 24 * 60 * 60 }
      )
    }

    res.status(200).json({ profile: profileObj })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

/**
 * POST /api/borrower/salary-slip
 * Upload salary slip file
 */
export const uploadSalarySlip = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload a PDF, JPG, or PNG file (max 5MB).' })
    }

    const uploadedFile = req.file as Express.Multer.File & { buffer?: Buffer }
    const fileBuffer = uploadedFile.buffer

    if (!fileBuffer) {
      return res.status(400).json({ message: 'File buffer missing. Please retry the upload.' })
    }

    const ext = path.extname(uploadedFile.originalname)
    const key = `salary-slips/${userId}_${Date.now()}${ext}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: uploadedFile.mimetype,
      })
    )

    // Pre-signed URL lets the sanction team view the file without making the bucket public.
    // 7 days is long enough for a typical review cycle.
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: s3BucketName, Key: key }),
      { expiresIn: 7 * 24 * 60 * 60 }
    )

    // Store the S3 key (not the signed URL) so we can regenerate links later if needed
    const s3Key = `s3://${s3BucketName}/${key}`
    const profile = await borrowerService.updateSalarySlip(userId, s3Key)

    res.status(200).json({
      message: 'Salary slip uploaded successfully',
      uploadedTo: 's3',
      key,
      salarySlipUrl: signedUrl,
      profile,
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Upload failed' })
  }
}

/**
 * POST /api/borrower/loan/apply
 * Apply for a loan
 */
export const applyForLoan = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { loanAmount, tenure } = req.body

    if (loanAmount === undefined || tenure === undefined) {
      return res.status(400).json({
        message: 'loanAmount and tenure are required',
      })
    }

    const loan = await borrowerService.applyForLoan(userId, {
      loanAmount: Number(loanAmount),
      tenure: Number(tenure),
    })

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan,
    })
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Application failed' })
  }
}

/**
 * GET /api/borrower/loans
 * Get own loans
 */
export const getLoans = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const loans = await borrowerService.getBorrowerLoans(userId)

    res.status(200).json({ loans })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Server error' })
  }
}
