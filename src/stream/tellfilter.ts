import { Transform } from "node:stream";

export class TellFilter extends Transform {
  private lastTellTimestamp = 0;
  private lastTell = "";
  objectMode = true;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    private readonly tellStartMatcher: RegExp = /^(.*?|You) (tells?|says? to) (you|.*?):/
  ) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  _transform(line: string, encoding: string, next: any) {
    // console.debug("Processing line:", `'${line.trimEnd()}'`);
    try {
      if (this.lastTell != "") {
        if (line == "" || line.charAt(0) != " ") {
          // console.debug("Full Tell", this.lastTell);
          this.push({
            timestamp: this.lastTellTimestamp,
            message: this.lastTell,
          });
          this.lastTellTimestamp = 0;
          this.lastTell = "";
        } else {
          //   console.debug("Adding line");
          this.lastTell += " " + line.trim();
        }
      }
      if (this.tellStartMatcher.test(line)) {
        // console.debug("Found new tell:");
        this.lastTellTimestamp = Date.now();
        this.lastTell = line;
      }
    } catch (err) {
      // noop
    }
    // console.log("==");
    clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      if (this.lastTell && this.lastTellTimestamp) {
        try {
          this.push({
            timestamp: this.lastTellTimestamp,
            message: this.lastTell,
          });
          this.lastTell = "";
          this.lastTellTimestamp = 0;
        } catch (err) {
          // noop
        }
      }
    }, 500);
    next();
  }

  flush(cb: any) {
    if (this.lastTell && this.lastTellTimestamp) {
      try {
        this.push({
          timestamp: this.lastTellTimestamp,
          message: this.lastTell,
        });
      } catch (err) {
        // noop
      }
    }
    this.lastTell = "";
    this.lastTellTimestamp = 0;
    cb();
  }
}
