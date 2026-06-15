import { redirect } from "next/navigation";

export default function TasksAssignedToMePage() {
  redirect("/tasks?scope=assigned-to-me");
}
