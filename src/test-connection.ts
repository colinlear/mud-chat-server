import { Connection } from "./connection/connection";
import { AncientAnguish } from "./muds";

(async () => {
  const conn = new Connection(
    AncientAnguish,
    {
      username: "deadmeat",
      password: "bumpkin",
    },
    false
  );
  conn.tells.pipe(process.stdout);
  await conn.connect();
  await new Promise((r) => setTimeout(r, 1000));
  conn.sendCommand("who");
  await new Promise((r) => setTimeout(r, 1000));
  conn.sendCommand("finger serf");
  await new Promise((r) => setTimeout(r, 1000));
  conn.sendTell("serf", "hello");
  await new Promise((r) => setTimeout(r, 600000));
  conn.sendCommand("quit");
  await new Promise((r) => setTimeout(r, 1000));
  conn.disconnect();
})();
