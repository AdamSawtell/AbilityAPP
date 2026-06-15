import { redirect } from "next/navigation";

export default function TasksPastPage() {
  redirect("/tasks?scope=past");
}
