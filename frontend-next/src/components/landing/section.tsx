import { cn } from "@/lib/utils";
import { MaskReveal } from "@/components/motion/mask-reveal";

/**
 * Section — the shared vertical-rhythm + container wrapper every landing
 * section uses, so gutters, max-width, and spacing stay identical across the
 * page. `muted` paints a subtle `bg-muted/30` band for section-to-section
 * contrast without introducing color.
 */
export function Section({
  id,
  className,
  muted = false,
  children,
}: {
  id?: string;
  className?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-24 md:py-32",
        muted && "bg-muted/30 border-y border-border/60",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-16">{children}</div>
    </section>
  );
}

/**
 * SectionHeading — canonical eyebrow / title / subtitle stack. Wipes in on
 * scroll. Left-aligned by default; pass align="center" for the rare centered
 * header.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <MaskReveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-4xl font-light leading-[1.02] tracking-[-0.03em] md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </MaskReveal>
  );
}
