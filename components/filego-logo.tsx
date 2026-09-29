export function FilegoLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
/** Gradient app tile with the Filego glyph, used wherever the brand appears. */
export function FilegoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = { sm: "h-8 w-8 rounded-lg", md: "h-9 w-9 rounded-xl", lg: "h-11 w-11 rounded-2xl" }[size];
  const glyph = { sm: "h-4 w-4", md: "h-[18px] w-[18px]", lg: "h-5 w-5" }[size];

  return (
    <span
      className={`bg-gradient-brand flex shrink-0 items-center justify-center text-white shadow-md shadow-primary/25 ring-1 ring-white/20 ring-inset ${box}`}
    >
      <FilegoLogo className={glyph} />
    </span>
  );
}
