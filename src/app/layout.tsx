import type { Metadata } from "next";
import { Chakra_Petch, Inter } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const chakra = Chakra_Petch({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-chakra" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Beskar Bandits", template: "%s | Beskar Bandits" },
  description: "Coed softball. Forged in beskar. Schedule, stats, and highlights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakra.variable} ${inter.variable}`}>
      <body className="bg-steel-950 text-steel-100 font-body min-h-dvh pb-20 md:pb-0">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 md:px-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
