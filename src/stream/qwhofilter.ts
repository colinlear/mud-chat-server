import { Transform } from "node:stream";

const qwhoStartMatcher: RegExp =
  /^There are (\d+) players currently adventuring:/;

export class QwhoFilter extends Transform {
  private playerCount = 0;
  private players: string[] = [];
  objectMode = true;

  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  _transform(line: string, encoding: string, next: any) {
    try {
      if (this.playerCount > 0) {
        const online = line.trim().split(/\s+/);
        for (const player of online) {
          if (player.trim() != "" && this.playerCount > 0) {
            this.players.push(player);
            this.playerCount--;
          }
        }
        if (this.playerCount <= 0) {
          this.push(this.players);
          this.players = [];
        }
      } else {
        const isQwho = qwhoStartMatcher.exec(line.trim());
        if (isQwho != null) {
          this.playerCount = parseInt(isQwho[1] ?? "0", 10) ?? 0;
        }
      }
    } catch (err) {
      // noop
    }
    // console.log("==");
    next();
  }

  flush(cb: any) {
    if (this.players.length > 0) {
      try {
        this.push(this.players);
      } catch (err) {
        // noop
      }
    }
    this.playerCount = 0;
    this.players = [];
    cb();
  }
}
