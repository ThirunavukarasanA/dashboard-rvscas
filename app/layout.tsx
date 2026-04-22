import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RVS CAS Data Dashboard",
  description: "Read-only MongoDB dashboard for configured RVS CAS data sources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
