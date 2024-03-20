import { randomUUID } from "node:crypto";
import { TellMessage } from "./session";

export interface TellCache {
  addTell: (tell: Omit<TellMessage, "id">) => Promise<TellMessage>;
  getTells: (timestamp: number) => Promise<TellMessage[]>;
}

export class MemoryTellCache implements TellCache {
  private tellCounter = 0;
  private baseCounter = randomUUID();
  private tells: TellMessage[] = [];

  async addTell(tell: Omit<TellMessage, "id">) {
    const ret = { ...tell, id: `${this.baseCounter} - ${this.tellCounter++}` };
    this.tells.push(ret);
    return Promise.resolve(ret);
  }

  getTells(ts: number) {
    return Promise.resolve(
      this.tells.filter(({ timestamp }) => ts < timestamp)
    );
  }
}
