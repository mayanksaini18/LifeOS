import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

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
      <div className="mx-auto w-full max-w-6xl px-6 md:px-16">{children}</div>
    </section>
  );
}

/**
 * SectionHeading — canonical eyebrow / title / subtitle stack. Reveals on
 * scroll. Centered by default; pass align="start" for left-aligned headers.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
