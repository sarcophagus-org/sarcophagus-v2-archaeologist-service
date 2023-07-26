import { archLogger } from "logger/chalk-theme";

export async function notifyUser(message: string) {
  const response = await fetch(process.env.WEBHOOK_URL!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
      archLogger.error(`Failed to send notification: ${response.statusText}`);
  }
}
