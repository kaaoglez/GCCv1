import type { Metadata } from "next";
import { Inter, Poppins, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gran Canaria Conecta - Tu isla, tu comunidad, tu futuro",
  description:
    "Portal comunitario de Gran Canaria. Anuncios, eventos, noticias y servicios locales con enfoque en sostenibilidad y economía circular.",
  keywords: [
    "Gran Canaria",
    "comunidad",
    "anuncios",
    "reciclaje",
    "economía circular",
    "eventos",
    "sostenibilidad",
    "Canarias",
  ],
  authors: [{ name: "Gran Canaria Conecta" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Gran Canaria Conecta",
    description:
      "Portal comunitario de Gran Canaria con enfoque en sostenibilidad y economía circular.",
    siteName: "Gran Canaria Conecta",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gran Canaria Conecta",
    description:
      "Portal comunitario de Gran Canaria con enfoque en sostenibilidad y economía circular.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SonnerToaster richColors position="bottom-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
