import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const fontSans = JetBrains_Mono({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Organize and manage your bookmarks with ease",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
