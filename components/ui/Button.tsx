import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60";

const variants = {
  primary:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:outline-emerald-400",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus-visible:outline-slate-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-slate-400 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white dark:focus-visible:outline-slate-600",
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
