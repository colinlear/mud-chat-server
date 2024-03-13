import { Transform, pipeline } from "stream";
import { LineTransformer } from "./linestream";
import { TellFilter } from "./tellfilter";

const lines = new LineTransformer();
const tells = new TellFilter();

pipeline(
  process.stdin,
  lines,
  tells,
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
