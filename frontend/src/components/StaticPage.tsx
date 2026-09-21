import type { ReactNode } from "react";

interface StaticPageProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

export function StaticPage({ title, intro, children }: StaticPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-10 md:py-16">
      <div className="mb-4 inline-flex items-center gap-2 border border-outline-variant bg-surface-container-low px-2.5 py-1">
        <span className="h-1.5 w-1.5 bg-primary-container" aria-hidden="true" />
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-primary">
          LoanPilot
        </span>
      </div>
      <h1 className="mb-4 font-headline-lg text-headline-lg tracking-tight text-primary md:text-display-hero md:leading-[52px]">
        {title}
      </h1>
      {intro && <p className="mb-8 font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{intro}</p>}
      <div className="space-y-10">{children}</div>
    </main>
  );
}

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 font-headline-md text-headline-md tracking-tight text-primary">{title}</h2>
      {children}
    </section>
  );
}

export const paragraph = "mb-3 font-body-md text-body-md leading-relaxed text-on-surface-variant";
export const listItem = "mb-2 list-disc marker:text-primary-container font-body-md text-body-md leading-relaxed text-on-surface-variant";
export const strong = "text-on-surface";