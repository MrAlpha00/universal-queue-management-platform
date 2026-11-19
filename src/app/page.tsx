import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { Workflow } from "@/components/marketing/workflow";
import { Capabilities } from "@/components/marketing/capabilities";
import { FinalCta } from "@/components/marketing/final-cta";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>
        <Hero />
        <FeatureBento />
        <Workflow />
        <Capabilities />
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  );
}
