import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGate, AuthProvider } from "@/lib/auth-store";
import { DataProvider } from "@/lib/data-store";
import { ReferenceDataProvider } from "@/lib/config-store";
import { TaskTypeProvider } from "@/lib/task-type-store";
import { OrganizationProvider } from "@/lib/organization-store";
import { OrgChartTierConfigProvider } from "@/lib/org-chart-tier-config-store";
import { OrgStructureProvider } from "@/lib/org-structure-store";
import { OrgAutomationContextBridge } from "@/components/org-automation-context-bridge";
import { TaskAutomationRunner } from "@/components/task-automation-runner";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { AiChatShellProvider } from "@/lib/ai/chat-shell-store";
import { SystemTimezoneProvider } from "@/lib/system-timezone-store";
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
                    <SystemTimezoneProvider>
                    <OrgChartTierConfigProvider>
                      <OrgStructureProvider>
                      <OrgAutomationContextBridge />
                      <TaskAutomationRunner />
                      <WorkspaceProvider>
                        <AiChatShellProvider>{children}</AiChatShellProvider>
                      </WorkspaceProvider>
                      </OrgStructureProvider>
                    </OrgChartTierConfigProvider>
                    </SystemTimezoneProvider>
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
