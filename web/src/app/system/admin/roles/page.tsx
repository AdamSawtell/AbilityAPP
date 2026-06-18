import { redirect } from "next/navigation";

export default function SystemRolesRedirect() {
  redirect("/admin/roles");
}
