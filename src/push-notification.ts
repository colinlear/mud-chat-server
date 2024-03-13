export interface PushNotificationApi {
  sendPush: (token: string, payload: any) => Promise<boolean>;
}

export class PushNotificationLogger implements PushNotificationApi {
  sendPush(token: string, payload: any) {
    console.log("Send Push notification:", token, payload);
    return Promise.resolve(true);
  }
}
