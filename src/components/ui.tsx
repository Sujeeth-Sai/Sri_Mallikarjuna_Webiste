import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

export function Modal({ open, onClose, title, children, width = 'max-w-xl' }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string; width?: string }>) {
  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[90vh] w-full ${width} overflow-auto rounded-2xl bg-cream shadow-2xl`} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} transition={{ type: 'spring', stiffness: 340, damping: 28 }} onMouseDown={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-cream/95 px-5 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral' }) {
  const colors = { green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', amber: 'bg-amber-50 text-amber-700 ring-amber-600/15', red: 'bg-red-50 text-red-700 ring-red-600/15', blue: 'bg-sky-50 text-sky-700 ring-sky-600/15', neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10' }
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[tone]}`}>{children}</span>
}

export function Empty({ text }: { text: string }) {
  return <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/40 text-sm text-slate-500">{text}</div>
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-brass">{eyebrow}</p><h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}</div>
    {action}
  </div>
}
