import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="pt-24">{children}</main>
      <PublicFooter />
    </div>
  );
}
