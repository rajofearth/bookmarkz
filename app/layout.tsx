import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { getToken } from "@/lib/auth-server";

const fontSans = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://bukmarks.app"
  ),
  title: { default: "Bukmarks", template: "%s | Bukmarks" },
  description: "Organize and manage your bookmarks with ease",
  keywords: [
    "bookmarks",
    "save links",
    "organize bookmarks",
    "bookmark manager",
  ],
  authors: [{ name: "Yashraj Maher", url: "https://yashrajmaher.vercel.app" }],
  creator: "Yashraj Maher",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Bukmarks",
    images: [
      {
        url: "/bukmarks-icon-light.png",
        width: 512,
        height: 512,
        alt: "Bukmarks",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Bukmarks",
    description: "Organize and manage your bookmarks with ease",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();

  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ConvexClientProvider initialToken={token}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
