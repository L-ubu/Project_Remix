import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { updateTask, getTask } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const taskId = Number(formData.get("taskId"));
  const status = formData.get("status") as "todo" | "in-progress" | "done";
  const returnTo = formData.get("returnTo") as string | null;

  if (!taskId || !status) {
    return json({ error: "Invalid data" }, { status: 400 });
  }

  const task = getTask(taskId);
  if (!task) {
    return json({ error: "Task not found" }, { status: 404 });
  }

  updateTask(taskId, { status });
  
  // If called from focus window or needs redirect, return redirect
  if (returnTo) {
    return redirect(returnTo);
  }
  
  // Otherwise return to tasks page to trigger revalidation
  return redirect("/tasks");
}

