'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-black text-white border-black/10'
          if (toast.type === 'success') bgColor = 'bg-green-500 text-white border-green-600'
          if (toast.type === 'error') bgColor = 'bg-red-500 text-white border-red-600'
          if (toast.type === 'warning') bgColor = 'bg-yellow-500 text-black border-yellow-600'
          if (toast.type === 'info') bgColor = 'bg-white text-black border-black/10'

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-4 p-4 min-w-[300px] border shadow-[4px_4px_0px_rgba(0,0,0,0.1)] animate-[slideUp_0.3s_ease-out] ${bgColor}`}
            >
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
              <button
                className="opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
