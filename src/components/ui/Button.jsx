import Link from "next/link";

const variants = {
  dark: "border-[#0b0b0b] bg-[#0b0b0b] text-[#f1ece4] hover:bg-transparent hover:text-[#0b0b0b]",
  light: "border-[#f1ece4] bg-[#f1ece4] text-[#0b0b0b] hover:bg-transparent hover:text-[#f1ece4]",
  outlineDark: "border-[#0b0b0b] text-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-[#f1ece4]",
  outlineLight: "border-[#f1ece4] text-[#f1ece4] hover:bg-[#f1ece4] hover:text-[#0b0b0b]",
};

export default function Button({
  href,
  children,
  variant = "outlineDark",
  className = "",
}) {
  const classes = `inline-flex items-center justify-center border px-7 py-4 text-xs uppercase tracking-[0.28em] transition duration-300 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}