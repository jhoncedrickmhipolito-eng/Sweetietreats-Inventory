import type { Metadata } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sweetie Treats Inventory",
  description: "Money, stock, and ingredients tracker for Sweetie Treats",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf3e3] text-[#2b0f0a]">
        <header className="bg-white/70 shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
            <Image
              src="/logo.png"
              alt="Sweetie Treats logo"
              width={56}
              height={56}
              priority
              className="h-14 w-14 rounded-full object-cover"
            />
            <div>
              <span className="block text-lg font-extrabold tracking-wide text-[#e7549d]">
                Sweetie Treats
              </span>
              <span className="block text-xs font-semibold uppercase tracking-widest text-[#3d1a10]">
                Inventory
              </span>
            </div>
          </div>
          <div className="mx-auto max-w-4xl">
            <Nav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
