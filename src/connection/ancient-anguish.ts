import { AncientAnguish } from "../muds";
import {
  Connection,
  ConnectionStatus,
  ConnectionCredentials,
} from "./connection";

export class AncientAnguishConnection extends Connection {
  constructor(
    credentials: ConnectionCredentials,
    onStatusChange: (status: ConnectionStatus) => void,
    reconnect = false
  ) {
    super(AncientAnguish, credentials, onStatusChange, reconnect);
  }

  async disconnect() {
    this.reconnect = false;
    if (this.status == "connected") {
      this.sendCommand("quit");
      // wait 200ms for quit send and then it should disconnect...
      await new Promise((r) => setTimeout(r, 200));
      this.cleanup();
    } else {
      super.disconnect();
    }
  }

  onLogin() {
    this.sendCommand("prompt off");
    this.sendCommand("ansi off");
    this.sendCommand("qwho");
  }

  keepalive(): void {
    // send a new line every 10 seconds to keepalive...
    setInterval(() => {
      try {
        if (this._status === "connected") {
          this.sendCommand("qwho");
        }
      } catch (e) {
        // ignore
      }
    }, 10000);
  }

  detectStatus(line: string) {
    if (this._status === "authenticating" && line.trim() !== "") {
      // console.debug("authenticating", line.toString());
      if (line.startsWith("Wrong password!")) {
        this.setStatus("password-failed");
      } else if (line.startsWith("Throw the other copy out?")) {
        this.setStatus("already-logged-in");
      } else if (line.startsWith("> ")) {
        this.setStatus("connected");
      } else if (line.includes("Welcome back to YOUR /\\_ncient /\\_nguish")) {
        this.setStatus("connected");
      }
    }
  }
}
