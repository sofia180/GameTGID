import "./globals.css";
import { Oxanium, Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import Nav from "../components/Nav";

const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-display" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "GameTG",
  description: "Viral Telegram crypto mini-games"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oxanium.variable} ${spaceGrotesk.variable}`}>
      <body className="font-[var(--font-body)]">
        <Providers>
          <Nav />
          <main className="px-4 pb-16 pt-6 md:px-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
