import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { addPomodoroTime } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "pomodoro") {
    const taskId = Number(formData.get("taskId"));
    const minutes = Number(formData.get("minutes"));

    if (!taskId || !minutes) {
      return json({ error: "Invalid data" }, { status: 400 });
    }

    addPomodoroTime(taskId, minutes);
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

