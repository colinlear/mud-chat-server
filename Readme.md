# Mud Chat Server

The mud chat server is a connection proxy for the mud.

It logs into the mud using your username and password and then streams the data, extracting tells and messages and then transmitting the to the phone app via websocket or push notification.

## Configuration TBD

Currently configured for:

- Ancient Anguish (anguish.org)

Configuration requires the following details:

- hostname / ip
- port
- initialCommands (list of commands to run on connect)
- keepalive command (string of command to periodically send to keep the connection alive.)
  - "qwho" for ancient anguish to track online users

Other functionality is hardcoded and changes will be required to make them configurable.

- String pattern to detect the password is incorrect
- String pattern to detect the user is logged in from somewhere else (i.e. actively playing)
- String pattern(s) to detect the user has successfully logged in.
- Method for detecting and parsing messages from other players.
- Method for detecting and parsing who is online.
  - output from qwho for example.

## Connection Process

Server uses websockets. Connect to the websocket normally, then send a message with a stringified json object like:

```
{
    "action": "connect",
    "username": "<username>",
    "password": "<password>",
    "pushToken": "<push notification token>",
    "lastTimestamp": 100
}
```

The push token should be a unique string, preferably a valid push notification token for icloud or firebase.

the last timestamp is the epoch millisecond value of the last tell recieved. The connection will respond by sending any subsequent tells from the server.

## Create a character

Generally if you attempt to login as a user and that user does not exist, it will return a status that the character does not exist ("user-not-found").

You can then trigger the creation of the user by passing in details of the characters sex and species using the follow json message:

```
{
  "action": "create",
  "species": "<supported species>",
  "sex": "<supported sex>"
}
```

The species and sexes supportedd by a mud may vary.

[TODO configure this]

## Connection Status

When connected to the websocket, the server will periodically send connection status events which look like:

```
{
    "event": "connection"
    "status": "<connection-status>"
}
```

Known connection statuses are:

- connecting (connecting to the mud)
- authenticating (connected to the mud and authenticating)
- connected (successful connected)
- password-failed (incorrect password error)
- already-logged-in (logged in to the same user from another location)
- disconnected (disconnected / logged off from the mud)
- user-not-found (username does not exist)
- not-logged-in (not connected to a mud session)

If the client is disconnected it will usually attempt reconnection indefinitely. [TBD change this to a timeout of 90mins if the app has not connected]

## Users online

When connected to the websocket. The server will periodically send a list of users connected to the mud and connected to the app.

For mud users:

```
{
    "event": "users",
    "users": ["<usernames...>"]
}
```

For app users: (only users who are actually connected via the phone, people actually playing won't be in the list) [TDB determine if this is necessary by asking someone who uses the app]

```
{
    "event": "appusers",
    "users": ["<usernames...>"]
}
```

## Sending Messages

Sending messages is achieved by sending an event to the websocket that looks like:

```
{
    "action": "tell",
    "username": [<"list of possible usernames">],
    "message": "<message string>
}
```

This will send the message to all usernames in the list.

## Updating the push notification token

Periodically, or after updating the app, the push notification tokens will be expired.

When this happens, you should connect with the old push notification token, and then set a new token by sending the following json message:

```
{
  "action": "setPushToken",
  "pushToken": "<push nofitication token>"
}
```

connecting with the old token is not necessary though. If the token is expired it will be deleted when it fails to send a push notification.

## Logout

When you logout the server will kill the persistent connection to the mud and purge any cached messages.

It's probably best to the logout of the app before logging into the mud directtly to play as that user.

Send the follow json message:

```
{
  "action": "disconnect"
}
```

## Brainstorming

- Might be easier to implement a post endpoint for short connections (phone apps running in the background) that checks the credentials of the user and responds with the latest messages.

- The server currently caches messages on the server. This is required if the app is in the background. This has some issues:
  - how long to cache messages for?
  - how to ensure messages are delievered to all devices before being purged
  - how to store these messages such that are not purged if the server restarts or crashes
    - DynamoDB? (cheap, easy, TTL for cache expiry)
    - SQLite? (cross platform means no clustering)
    - Logfiles? (messy)
