import { Suspense } from "react";
import { MobileLoginPage } from "@/components/mobile/mobile-login-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MobileLoginPage />
    </Suspense>
  );
}
