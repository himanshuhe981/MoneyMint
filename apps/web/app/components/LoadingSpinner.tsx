export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="border-4 border-black/10 border-t-black rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
