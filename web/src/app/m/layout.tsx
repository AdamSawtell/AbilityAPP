import type { Metadata, Viewport } from "next";
import { MobilePrivacyGate } from "@/components/mobile/mobile-privacy-gate";
import { MobileSwRegister } from "@/components/mobile/mobile-sw-register";
import { MOBILE_APP_NAME, MOBILE_APP_SHORT_NAME } from "@/lib/mobile/constants";

export const metadata: Metadata = {
  title: MOBILE_APP_NAME,
  description: "Mobile shifts, check-in, timesheets, and tasks for support workers.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: MOBILE_APP_SHORT_NAME,
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#b51266",
};

export default function MobileRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobilePrivacyGate>
      <MobileSwRegister />
      {children}
    </MobilePrivacyGate>
  );
}
