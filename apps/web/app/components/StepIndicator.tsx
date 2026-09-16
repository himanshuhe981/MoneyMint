interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10 mt-6 relative">
      {/* Background Line */}
      <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-black/10 -z-0"></div>

      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep

        return (
          <div key={label} className="flex flex-col items-center relative z-10 w-24">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                isCompleted
                  ? 'border-black bg-black text-white'
                  : isCurrent
                  ? 'border-black bg-white text-black scale-110 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  : 'border-black/20 text-black/40 bg-[#fafafa]'
              }`}
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7.5L6 10.5L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{stepNum}</span>
              )}
            </div>
            <span
              className={`mt-4 text-[10px] tracking-widest uppercase font-bold text-center ${
                isCompleted || isCurrent ? 'text-black' : 'text-black/40'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
