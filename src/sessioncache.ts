import { ConnectionHost } from "./connection/connection";
import { ConnectionSession } from "./session";

export class SessionCache {
  constructor(readonly host: ConnectionHost) {}

  private readonly sessions: Record<string, ConnectionSession | undefined> = {};

  async getSession(
    username: string,
    password: string,
    create: boolean = false
  ) {
    let session = this.sessions[username];
    if (session?.connection.reauthenticate(username, password)) {
      return Promise.resolve(session);
    } else if (create) {
      // create a new session
      const ret = (this.sessions[username] = new ConnectionSession({
        username: username,
        password: password,
      }));
      await ret.connection.connect();
      return ret;
    }
  }

  purgeSession(username: string) {
    delete this.sessions[username];
  }
}
