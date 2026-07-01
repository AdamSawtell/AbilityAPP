import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobileIosInstallGuide } from "@/components/mobile/mobile-ios-install-guide";

export default function MobileInstallPage() {
  return (
    <MobileAuthGuard>
      <MobileEmployeeShell title="Install on iPhone" subtitle="Add to your home screen" hideNav>
        <MobileIosInstallGuide />
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
