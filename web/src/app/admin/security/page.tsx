import { redirect } from "next/navigation";

export default function AdminSecurityRedirectPage() {
  redirect("/system/settings/security");
}
