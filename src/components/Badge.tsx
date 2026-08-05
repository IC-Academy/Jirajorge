interface BadgeProps {
  label: string
  className?: string
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
        className ?? 'bg-slate-100 text-slate-700 border-slate-300'
      }`}
    >
      {label}
    </span>
  )
}
