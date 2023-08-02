import { archLogger } from "../logger/chalk-theme";
import fetch from "node-fetch";

import sgMail from "@sendgrid/mail";

export async function notifyUser(message: string) {
  try {
    const timestamp = new Date().toISOString();
    const msgData = { message, timestamp };

    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      const response = await fetch(process.env.NOTIFICATION_WEBHOOK_URL!, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(msgData),
      });

      if (!response.ok) {
        archLogger.error(`Failed to send notification to webhook: ${response.statusText}`);
      }
    }

    if (process.env.NOTIFICATION_SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.NOTIFICATION_SENDGRID_API_KEY!);
      const msg = {
        to: process.env.NOTIFICATION_SENDGRID_EMAIL!,
        from: process.env.NOTIFICATION_SENDGRID_VERIFIED_SENDER!,
        subject: "Your Archaeologist Node Sent You A Message!",
        text: JSON.stringify(msgData),
      };

      await sgMail.send(msg);
    }
  } catch (error) {
    archLogger.error(`Failed to send notification: ${error.toString()}`);
  }
}
