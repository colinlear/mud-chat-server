import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

initializeApp({ credential: applicationDefault() });

export interface PushNotificationApi {
  sendPush: (
    tokens: string[],
    id: string,
    message: string,
    timestamp: string
  ) => Promise<boolean>;
}

export class PushNotificationLogger implements PushNotificationApi {
  async sendPush(
    tokens: string[],
    messageId: string,
    message: string,
    timestamp: string
  ) {
    try {
      console.debug("Message", {
        notification: {
          title: "Ancient Anguish",
          body: message,
        },
        data: {
          messageId,
          timestamp: timestamp.toString(),
        },
        tokens,
      });
      const response = await getMessaging().sendEach(
        tokens.map((token) => ({
          notification: {
            title: "Ancient Anguish",
            body: message,
          },
          data: {
            messageId,
            timestamp: timestamp.toString(),
          },
          token,
        }))
      );
      console.log(
        response.successCount + " messages were sent successfully",
        response
      );
      for (const resp of response.responses) {
        console.log("Error", resp.error?.message);
      }
      console.log("Send Push notification:", tokens, message, timestamp);
      return Promise.resolve(true);
    } catch (e) {
      console.log("Send Push Failed:", e);
      return Promise.resolve(false);
    }
  }
}
