import { Transform } from "node:stream";

export class LineTransformer extends Transform {
  private lastLine = "";
  objectMode = true;

  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  _transform(chunk: Buffer, encoding: string, next: any) {
    const data = this.lastLine + chunk.toString();
    const hasNewline = data.endsWith("\n");
    const lines = data.split("\n");
    if (!hasNewline) {
      this.lastLine = lines.pop() ?? "";
    } else {
      this.lastLine = "";
    }
    for (let l of lines) {
      try {
        // breakout prompts onto newlines...
        while (l.startsWith("> ")) {
          l = l.substring(2);
          this.push("> ");
        }
        const finalLine = l.replace(/[\r\n]/g, "");
        this.push(finalLine);
      } catch (err) {
        // noop
      }
    }

    next();
  }

  flush(cb: any) {
    if (this.lastLine) {
      try {
        this.push(this.lastLine);
      } catch (err) {
        // noop
      }
    }
    this.lastLine = "";
    cb();
  }
}
