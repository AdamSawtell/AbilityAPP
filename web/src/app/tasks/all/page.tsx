import { redirect } from "next/navigation";

export default function TasksAllPage() {
  redirect("/tasks?scope=all");
}
