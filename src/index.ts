import dotenv from "dotenv";
import express from "express";
import expressWs from "express-ws";

import { ConnectionSession } from "./session";
import { SessionCache } from "./sessioncache";
import { AncientAnguish } from "./muds";

dotenv.config();

const expressApp = express();
const app = expressWs(expressApp).app;

const port = process.env.PORT || 3000;

const sessions = new SessionCache(AncientAnguish);

app.get("/", function (req, res) {
  console.log("get route");
  res.end();
});

app.ws("/", function (ws, req) {
  let activeSession: ConnectionSession | undefined = undefined;
  let connectionPushToken: string | undefined = undefined;
  ws.on("close", () => {
    if (activeSession && connectionPushToken) {
      activeSession.unbindSocket(connectionPushToken);
      connectionPushToken = undefined;
      activeSession = undefined;
    }
  });
  ws.on("message", async (msg) => {
    try {
      const command = JSON.parse(msg.toString());
      console.debug("Command:", command);
      switch (command?.action) {
        case "connect":
          if (activeSession) {
            ws.send(
              JSON.stringify({ error: "connect", message: "Already connected" })
            );
            return;
          }
          activeSession = await sessions.getSession(
            command.username,
            command.password,
            true
          );
          connectionPushToken = command.pushToken;
          activeSession?.bindSocket(connectionPushToken ?? "", ws);
          ws.send(JSON.stringify({ status: activeSession?.connection.status }));
          await activeSession?.sendOldTells(ws, command.lastTimestamp);
          break;
        case "disconnect":
          if (activeSession) {
            activeSession.connection.disconnect();
            sessions.purgeSession(activeSession.credentials.username);
            activeSession = undefined;
            connectionPushToken = undefined;
          }
          ws.send(JSON.stringify({ status: "not-logged-in" }));
          break;
        case "setPushToken":
          if (activeSession) {
            if (connectionPushToken != null) {
              activeSession.unbindSocket(connectionPushToken);
            }
            connectionPushToken = command.pushToken;
            activeSession.bindSocket(connectionPushToken ?? "", ws);
          }
          break;
        case "sendMessage":
          if (activeSession && command.username.length > 0) {
            activeSession.sendTell(command.username[0], command.message);
          }
          break;
        default:
          console.warn("Unknown Command", command);
      }
    } catch (e) {
      console.warn("Invalid command", msg, req.ip);
    }
  });
  ws.send(JSON.stringify({ status: "not-logged-in" }));
  console.log("socket", req.ip);
});

app.listen(port, () => {
  console.info("Server Running....");
});
