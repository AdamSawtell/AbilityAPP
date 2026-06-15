import { redirect } from "next/navigation";

export default function TasksMyRolePage() {
  redirect("/tasks?scope=my-role");
}
