import { TellMessage } from "./session";

export interface TellCache {
  addTell: (tell: TellMessage) => Promise<void>;
  getTells: (timestamp: number) => Promise<TellMessage[]>;
}

export class MemoryTellCache implements TellCache {
  private tells: TellMessage[] = [];

  async addTell(tell: TellMessage) {
    this.tells.push(tell);
    return Promise.resolve();
  }

  getTells(ts: number) {
    return Promise.resolve(
      this.tells.filter(({ timestamp }) => ts < timestamp)
    );
  }
}
