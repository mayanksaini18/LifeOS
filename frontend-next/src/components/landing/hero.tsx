import Link from "next/link";
import { ArrowRight01Icon, ArrowDown01Icon } from "hugeicons-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/**
 * Hero — the opening section of the /welcome marketing page.
 *
 * Deliberately a marketing surface rather than a signup form: one CTA to
 * /register, which owns the three auth methods. The previous version embedded
 * all three here, which left no room for the page to breathe.
 *
 * Renders statically: the headline and subheading are plain markup, with no
 * client component gating their visibility. The former morph/rotate treatment
 * held both behind `opacity-0` until fonts resolved and a timer ran, which put
 * the page's primary message at the mercy of client JS.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pt-28 pb-20 md:pt-32">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-16">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          LifeOS · Daily wellness
        </p>

        <h1 className="max-w-4xl font-heading text-5xl font-light leading-none tracking-[-0.035em] md:text-7xl lg:text-8xl">
          A better way to take care of yourself.
        </h1>

        <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
          Habits, mood, sleep, hydration, fitness, and insights. All in one
          place. Quietly keeping track of{" "}
          <span className="text-foreground">yourself</span>.
        </p>

        <div className="mt-12">
          {/*
           * A plain styled <Link>, not the shared <Button> primitive: Base
           * UI's Button forces role="button" on whatever it renders once
           * nativeButton={false} (see @base-ui/react/use-button), which would
           * make this page-navigation CTA announce as a button instead of a
           * link. buttonVariants() gives identical visuals without that
           * override.
           */}
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "h-11 rounded-full px-7 font-mono text-[10px] uppercase tracking-widest"
            )}
          >
            Create an account
            <ArrowRight01Icon className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">
            Free to use. No credit card needed.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex">
        <ArrowDown01Icon className="h-5 w-5 animate-bounce text-muted-foreground" />
      </div>
    </section>
  );
}
