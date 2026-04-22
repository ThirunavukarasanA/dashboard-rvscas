import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${className}`}
      {...props}
    />
  );
}
