import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:outline-emerald-400",
  secondary:
    "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500 hover:bg-slate-800 focus-visible:outline-slate-500",
  ghost: "text-slate-300 hover:bg-slate-900 hover:text-white focus-visible:outline-slate-600",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function LinkButton({
  className = "",
  variant = "secondary",
  href,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} href={href} {...props}>
      {children}
    </Link>
  );
}
