import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AeroVolt ERS v2.0",
  description: "F1 2026 Energy Recovery Strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0F1115] text-[#F8FAFC] antialiased`}>
        {children}
      </body>
    </html>
  );
}
