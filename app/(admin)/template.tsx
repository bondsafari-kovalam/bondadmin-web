/**
 * Re-mounts on every top-level page change (Overview ↔ Companies), so the new page fades and
 * rises in while the sidebar and header stay put. Tabs inside a company keep their own layout
 * and don't replay this. Disabled for users who prefer reduced motion.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out motion-reduce:animate-none">{children}</div>
}
