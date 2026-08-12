import "./globals.css";
import { Providers } from "@/providers";
import { ReactNode } from "react";

export const metadata = {
  title: "FinOS - Financial Operating System",
  description: "Automated Financial Analysis & Dashboards for SMBs",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-zinc-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}