import { Transform, pipeline } from "stream";
import { LineTransformer } from "./linestream";
import { QwhoFilter } from "./qwhofilter";

const lines = new LineTransformer();
const whos = new QwhoFilter();

pipeline(
  process.stdin,
  lines,
  whos,
  new Transform({
    objectMode: true,
    readableObjectMode: true,
    transform(chunk, _, callback) {
      this.push(JSON.stringify(chunk, null, 2));
      callback();
    },
  }),
  process.stdout,
  () => {
    console.log("done");
  }
);
