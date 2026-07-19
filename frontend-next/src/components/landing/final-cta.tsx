import Link from "next/link";
import { ArrowRight01Icon } from "hugeicons-react";
import { Section } from "@/components/landing/section";
import { MaskReveal } from "@/components/motion/mask-reveal";

/**
 * FinalCta — the closing call-to-action. An inverted band
 * (bg-foreground / text-background) that adapts to both themes because it is
 * built entirely from theme tokens. This is the one place solid fill is allowed.
 */
export function FinalCta() {
  return (
    <Section>
      <MaskReveal>
        <div className="rounded-3xl bg-foreground px-6 py-16 text-center text-background md:px-12 md:py-20">
          <div className="mx-auto max-w-xl">
            <p className="label-mono mb-4 text-background/60">
              Start today
            </p>
            <h2 className="display-heading text-3xl leading-[1.15] md:text-4xl">
              Start taking care of yourself today.
            </h2>
            <p className="mt-4 text-background/70 leading-relaxed">
              It only takes a minute to begin. Your future self will thank you.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {/*
               * A plain styled <Link>, not the shared <Button> primitive — same
               * reason as the hero: Base UI's Button (nativeButton={false})
               * forces role="button" on a link, and its default variant injects
               * `[a]:hover:bg-primary/80`, which — because this button renders as
               * an anchor — outranks a plain `hover:` class and turned the button
               * near-black (invisible on this dark band) on hover.
               */}
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
              >
                Create your account
                <ArrowRight01Icon className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium text-background/80 hover:text-background hover:bg-background/10 transition-colors"
              >
                I already have an account
              </Link>
            </div>

            <p className="mt-6 text-xs text-background/50">
              Free to use. No credit card needed.
            </p>
          </div>
        </div>
      </MaskReveal>
    </Section>
  );
}
