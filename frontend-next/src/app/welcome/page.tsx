import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { ModulesSection } from "@/components/landing/modules-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InsightsSection } from "@/components/landing/insights-section";
import { GamificationSection } from "@/components/landing/gamification-section";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function WelcomePage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <ModulesSection />
        <HowItWorks />
        <InsightsSection />
        <GamificationSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
