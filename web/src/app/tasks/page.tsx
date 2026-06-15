import { Suspense } from "react";
import { TaskHubView } from "@/components/task-hub-view";

export default function TasksIndexPage() {
  return (
    <Suspense fallback={null}>
      <TaskHubView />
    </Suspense>
  );
}
