import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ServiceWorkerCleanup } from "@/components/layout/ServiceWorkerCleanup";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AR Campus Navigation",
  description: "AR/VR campus navigation POC — four-mode Mapbox-native architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#060e20", color: "#dee5ff" }}>
        <ClerkProvider>
          <ServiceWorkerCleanup />
          {children}
          <Toaster position="top-center" richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
