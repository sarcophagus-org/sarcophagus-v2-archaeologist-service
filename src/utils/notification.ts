import { archLogger } from "../logger/chalk-theme";
import fetch from "node-fetch";

import sgMail from "@sendgrid/mail";
import { NetworkContext } from "../network-config";

export async function notifyUser(message: string, networkContext?: NetworkContext) {
  try {
    const timestamp = new Date().toISOString();
    const msgData = { chainId: process.env.CHAIN_ID, message, timestamp };

    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      const response = await fetch(process.env.NOTIFICATION_WEBHOOK_URL!, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(msgData),
      });

      if (!response.ok) {
        archLogger.error(
          `[${networkContext?.networkName}] Failed to send notification to webhook: ${response.statusText}`
        );
      }
    }

    if (process.env.NOTIFICATION_SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.NOTIFICATION_SENDGRID_API_KEY!);
      const msg = {
        networkContext:
          networkContext && `${networkContext.networkName} (${networkContext.chainId})`,
        to: process.env.NOTIFICATION_SENDGRID_EMAIL!,
        from: process.env.NOTIFICATION_SENDGRID_VERIFIED_SENDER!,
        subject: "Your Archaeologist Node Sent You A Message!",
        text: JSON.stringify(msgData),
      };

      await sgMail.send(msg);
    }
  } catch (error) {
    archLogger.error(
      `[${networkContext?.networkName}] Failed to send notification: ${error.toString()}`
    );
  }
}
