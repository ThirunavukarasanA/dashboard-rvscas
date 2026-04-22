import type { Metadata } from "next";
import "react-datepicker/dist/react-datepicker.css";
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
      <body className="flex min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('rvscas-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
