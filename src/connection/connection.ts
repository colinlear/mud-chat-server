import { WriteStream, existsSync, mkdirSync } from "fs";
import { createConnection, Socket } from "net";
import { resolve } from "path";
import { TellFilter } from "../stream/tellfilter";
import { LineTransformer } from "../stream/linestream";
import { QwhoFilter } from "../stream/qwhofilter";
import { Transform } from "stream";

export interface ConnectionHost {
  host: string;
  port: number;
}

export interface ConnectionCredentials {
  username: string;
  password: string;
}

export type ConnectionStatus =
  | "connecting"
  | "authenticating"
  | "connected"
  | "password-failed"
  | "already-logged-in"
  | "user-not-found"
  | "disconnected";

export abstract class Connection {
  protected client?: Socket;
  protected _status: ConnectionStatus = "disconnected";
  private log?: WriteStream;
  private readonly lines = new LineTransformer();
  readonly tells = new TellFilter();
  readonly who = new QwhoFilter();

  get status() {
    return this._status;
  }

  readonly connectionError = new Transform({
    objectMode: true,
    transform: (line, _, callback) => {
      this.detectStatus(line);
      callback();
    },
  });

  constructor(
    protected readonly host: ConnectionHost,
    protected readonly credentials: ConnectionCredentials,
    protected readonly onStatusChange: (status: ConnectionStatus) => void,
    protected reconnect = true
  ) {
    if (!existsSync(resolve(__dirname, "logs"))) {
      mkdirSync(resolve(__dirname, "logs"));
    }

    // this.lines
    //   .pipe(
    //     new Transform({
    //       transform(l, _, cb) {
    //         this.push(l + "\n");
    //         cb();
    //       },
    //     })
    //   )
    //   .pipe(process.stdout);

    this.keepalive();
    this.lines.pipe(this.tells);
    this.lines.pipe(this.who);
    this.lines.pipe(this.connectionError);
  }

  setStatus(status: ConnectionStatus) {
    this._status = status;
    this.onStatusChange(this._status);
  }

  abstract detectStatus(line: string): void;

  waitForConnnected(force = false) {
    return new Promise<boolean>(async (resolve) => {
      let count = 0;
      while (count++ < 50) {
        // console.debug("Wait for connect", this.status);
        if (
          this._status !== "connecting" &&
          this._status !== "authenticating"
        ) {
          if (force && this._status === "already-logged-in") {
            this.setStatus("authenticating");
            this.sendCommand("y");
          } else {
            if (this._status === "connected") {
              console.log("authenticated to server!");
              resolve(true);
            } else {
              resolve(false);
            }
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      this.disconnect();
      resolve(false);
    });
  }

  connect(force = false) {
    if (this._status == "connected") return Promise.resolve(true);
    if (this._status === "connecting") return this.waitForConnnected(force);
    this.setStatus("connecting");
    return new Promise<boolean>((resolve, reject) => {
      this.client = createConnection(
        { port: this.host.port, host: this.host.host },
        async () => {
          console.log("connected to server!");
          this.login();
          const connected = await this.waitForConnnected(force);
          if (!connected) {
            resolve(false);
          } else {
            this.onLogin();
            resolve(true);
          }
        }
      );
      this.client.on("connectionAttemptFailed", (e) => {
        console.log("Connection Attempt Failed", e);
      });
      this.client.pipe(this.lines);
      this.client.on("end", () => {
        if (
          this._status === "password-failed" ||
          this._status == "already-logged-in"
        ) {
          return;
        }
        this.setStatus("disconnected");
        this.log?.close();
        if (this.reconnect === true) {
          setTimeout(() => {
            console.debug("Reconnecting");
            this.connect();
          }, 1000);
        }
      });
    });
  }

  keepalive() {
    // send a new line every 10 seconds to keepalive...
    setInterval(() => {
      try {
        if (this._status === "connected") {
          this.sendCommand("");
        }
      } catch (e) {
        // ignore
      }
    }, 30000);
  }

  disconnect() {
    this.reconnect = false;
    this.setStatus("disconnected");
    this.client?.end();
    this.cleanup();
  }

  protected cleanup() {
    this.lines.destroy();
    this.connectionError.destroy();
    this.client?.destroy();
  }

  login() {
    this.sendCommand(this.credentials.username);
    this.setStatus("authenticating");
    this.sendCommand(this.credentials.password);
  }

  onLogin() {}

  sendCommand(cmd: string) {
    this.client?.write(`${cmd}\n`);
  }

  sendTell(username: string, message: string) {
    if (username.trim() == "" || message.trim() == "" || /\s/.test(username)) {
      return;
    }
    this,
      this.sendCommand(
        `tell ${username.toLowerCase()} ${message.replace(/\n/g, " ")}`
      );
  }

  reauthenticate(username: String, password: String): boolean {
    return (
      username === this.credentials.username &&
      password === this.credentials.password
    );
  }
}
