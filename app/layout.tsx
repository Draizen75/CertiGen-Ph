import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/ui/footer";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertiGen PH | Bulk Certificate Generator for Word & Excel",
  description: "The fastest way to generate certificates in bulk. Upload your Word template (.docx), map placeholders like [NAME], and generate accurate certificates from Excel/CSV data. 100% secure, free, and fast.",
  keywords: ["certificate generator", "bulk certificates", "word template generator", "excel to docx", "mail merge", "certificate automation", "philippines"],
  authors: [{ name: "CertiGen PH" }],
  verification: {
    google: "rWv0kbBERT9kJpBfm4dqen08mrVXXuggqeCVz2zKiGM",
  },
  openGraph: {
    title: "CertiGen PH | Bulk Certificate Generator",
    description: "Generate certificates in bulk from Word templates and Excel data instantly.",
    url: "https://certigenph.vercel.app", 
    siteName: "CertiGen PH",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CertiGen PH | Bulk Certificate Generator",
    description: "Generate certificates in bulk from Word templates and Excel data instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
