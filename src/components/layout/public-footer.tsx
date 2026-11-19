import Link from "next/link";
import { ArrowUpRight, BookOpen, Globe, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/config/brand";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Platform", href: "/platform-capabilities" },
      { label: "Get started", href: "/signup" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Service businesses", href: "/features" },
      { label: "Multi-branch teams", href: "/platform-capabilities" },
      { label: "Operations & staff", href: "/features" },
      { label: "Customers", href: "/how-it-works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Documentation", href: "/docs" },
      { label: "Status", href: "/about#status" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#070a14]">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {brand.description}
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { icon: Mail, href: `mailto:${brand.supportEmail}`, label: "Email" },
                { icon: Globe, href: "/about", label: "Website" },
                { icon: BookOpen, href: "/docs", label: "Docs" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-muted transition hover:border-violet-400/40 hover:text-violet-200"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-subtle">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.07] pt-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.legalName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/about#privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/about#terms" className="hover:text-foreground">Terms</Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
