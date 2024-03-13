import { Transform } from "stream";
import WebSocket from "ws";

import {
  Connection,
  ConnectionCredentials,
  ConnectionHost,
} from "./connection/connection";
import { MemoryTellCache, TellCache } from "./tellcache";
import {
  PushNotificationApi,
  PushNotificationLogger,
} from "./push-notification";
import { AncientAnguishConnection } from "./connection/ancient-anguish";

export interface TellMessage {
  timestamp: number;
  message: string;
}

export class ConnectionSession {
  private sockets: Record<string, WebSocket | null> = {};
  readonly connection: Connection;
  constructor(
    readonly credentials: ConnectionCredentials,
    private readonly cache: TellCache = new MemoryTellCache(),
    private readonly pushNotifier: PushNotificationApi = new PushNotificationLogger()
  ) {
    this.connection = new AncientAnguishConnection(
      this.credentials,
      (status) => {
        for (const token of Object.keys(this.sockets)) {
          const ws = this.sockets[token];
          if (ws != null) {
            ws.send(JSON.stringify({ event: "connection", status }));
          }
        }
      }
    );
    this.connection.tells.pipe(
      new Transform({
        objectMode: true,
        transform: (chunk: TellMessage, _, callback) => {
          this.cache.addTell(chunk);
          for (const token of Object.keys(this.sockets)) {
            const ws = this.sockets[token];
            if (ws != null) {
              ws.send(JSON.stringify(chunk));
            } else {
              this.pushNotifier.sendPush(token, {
                latest: chunk.timestamp,
              });
            }
          }
          callback();
        },
      })
    );
    // todo refactor to a single global who monitor...
    this.connection.who.pipe(
      new Transform({
        objectMode: true,
        transform: (users, _, callback) => {
          console.info("Mud Users", users);
          for (const token of Object.keys(this.sockets)) {
            const ws = this.sockets[token];
            if (ws != null) {
              ws.send(JSON.stringify({ event: "users", users }));
            }
          }
          callback();
        },
      })
    );
  }

  bindSocket(pushNotificationToken: string, ws: WebSocket) {
    this.sockets[pushNotificationToken] = ws;
  }

  unbindSocket(pushNotificationToken: string) {
    this.sockets[pushNotificationToken] = null;
  }

  async sendOldTells(ws: WebSocket, timestamp: number) {
    const oldTells = await this.cache.getTells(timestamp);
    for (const tell of oldTells) {
      if (timestamp < tell.timestamp) {
        ws.send(JSON.stringify(tell));
      }
    }
  }

  sendTell(username: string, message: string) {
    this.connection.sendTell(username, message);
  }
}
