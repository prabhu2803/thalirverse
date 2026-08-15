import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { springSoft } from "@/lib/motion";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThalirVerse | Learn. Lead. Grow.",
  description: "Join the movement of young innovators and empower your future today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${publicSans.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white font-body text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
        <MotionConfig reducedMotion="user" transition={springSoft}>
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
