import { motion } from "motion/react";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong overflow-hidden rounded-3xl p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] sm:p-9"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-7 border-t border-white/[0.08] pt-6 text-sm text-muted">{footer}</div>}
    </motion.div>
  );
}
