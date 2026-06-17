import { redirect } from "next/navigation";

export default function AdminRolesRedirect() {
  redirect("/system/admin/roles");
}
