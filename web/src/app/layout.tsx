import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGate, AuthProvider } from "@/lib/auth-store";
import { DataProvider } from "@/lib/data-store";
import { ReferenceDataProvider } from "@/lib/config-store";
import { TaskTypeProvider } from "@/lib/task-type-store";
import { OrganizationProvider } from "@/lib/organization-store";
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
  title: "AbilityAPP",
  description: "NDIS provider workspace for enquiries, clients, and service delivery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <AuthProvider>
          <AuthGate>
            <ReferenceDataProvider>
              <TaskTypeProvider>
                <DataProvider>
                  <OrganizationProvider>
                    <WorkspaceProvider>{children}</WorkspaceProvider>
                  </OrganizationProvider>
                </DataProvider>
              </TaskTypeProvider>
            </ReferenceDataProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
