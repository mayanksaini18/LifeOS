import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

/**
 * LegalShell — the frame both legal documents render into.
 *
 * Deliberately not `LandingNav`: that header's centre links are `#modules`
 * style anchors that only resolve on `/welcome`, and it carries a scroll
 * listener that would make these otherwise-static pages a client component.
 * Body copy is styled here with descendant selectors so the documents
 * themselves stay plain semantic HTML — there is no typography plugin.
 */
export function LegalShell({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-16">
          <Link href="/welcome" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lifeos-logo.svg" alt="" className="h-7 w-auto" />
            <span className="text-lg font-semibold tracking-tight">LifeOS</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              size="sm"
              className="rounded-full font-mono text-[10px] uppercase tracking-widest"
            >
              Get started
            </Button>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16 md:px-16 md:py-24">
        <p className="label-mono">Legal</p>
        <h1 className="display-heading mt-3 text-4xl md:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {summary}
        </p>
        <p className="label-mono mt-6">Last updated {LEGAL_LAST_UPDATED}</p>

        <div
          className={[
            "mt-14 space-y-12",
            "[&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:text-muted-foreground",
            "[&_li]:text-[15px] [&_li]:leading-[1.75] [&_li]:text-muted-foreground",
            "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
            "[&_strong]:font-medium [&_strong]:text-foreground",
            "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
          ].join(" ")}
        >
          {children}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

/** One numbered-feeling section of a legal document: heading plus body. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="display-heading text-xl text-foreground md:text-2xl">
        {heading}
      </h2>
      {children}
    </section>
  );
}
