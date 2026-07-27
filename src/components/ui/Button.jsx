import Link from "next/link";

const variants = {
  dark:
    "border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4] hover:bg-transparent hover:text-[#0b0b0b]",

  light:
    "border-[#f1ece4] bg-[#f1ece4] text-[#0b0b0b] hover:bg-transparent hover:text-[#f1ece4]",

  outlineDark:
    "border-[#0b0b0b] text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]",

  outlineLight:
    "border-[#f1ece4] text-[#f1ece4] hover:bg-[#f1ece4] hover:text-[#0b0b0b]",
};

export default function Button({
  href,
  children,
  variant = "outlineDark",
  className = "",
  type = "button",
  ...props
}) {
  const variantClasses =
    variants[variant] ||
    variants.outlineDark;

  const classes = [
    "obsidian-motion-button",
    "group relative inline-flex items-center justify-center overflow-hidden border px-7 py-4 text-xs uppercase tracking-[0.28em]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4",
    "active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="relative z-[1] inline-flex items-center justify-center gap-3">
      {children}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}
