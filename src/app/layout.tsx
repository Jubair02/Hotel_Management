import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
});

export const metadata: Metadata = {
  title: {
    default: "Grand Tulip — Boutique Hotel, Dhaka",
    template: "%s · Grand Tulip",
  },
  description:
    "A boutique hotel in the heart of Dhaka. Search availability, book a room, and manage your stay.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-pine-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-sand-200 bg-pine-950 text-pine-100">
          <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display text-xl text-white">Grand Tulip</p>
              <p className="mt-1 text-sm text-pine-100/70">
                12 Lake Drive Road, Gulshan, Dhaka 1212 · +880 1700 000000
              </p>
            </div>
            <div className="text-xs text-pine-100/50 sm:text-right">
              <p>Front desk open 24 hours · reception@grandtulip.com</p>
              <p className="mt-2">
                <a
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-pine-100"
                >
                  Privacy policy
                </a>
                <span aria-hidden> · </span>
                <a
                  href="/terms"
                  className="underline underline-offset-4 hover:text-pine-100"
                >
                  Terms of stay
                </a>
              </p>
              <p className="mt-2">
                Built by{" "}
                <a
                  href="https://jhossain.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-marigold-400 underline underline-offset-4 transition-colors hover:text-marigold-500"
                >
                  Jubair Hossain
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
