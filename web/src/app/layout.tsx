import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DataProvider } from "@/lib/data-store";
import { ReferenceDataProvider } from "@/lib/config-store";
import { WorkspaceProvider } from "@/lib/workspace-store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AbilityERP Clone",
  description: "NDIS ERP workspace for enquiries and clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <ReferenceDataProvider>
          <DataProvider>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </DataProvider>
        </ReferenceDataProvider>
      </body>
    </html>
  );
}
