import assert from "node:assert";
import test, { describe } from "node:test";

import { Readable, pipeline } from "node:stream";
import { TellFilter } from "./tellfilter";
import { LineTransformer } from "./linestream";

async function processTells(input: string[]) {
  const readable = Readable.from(input);
  const tells = new TellFilter();
  const result: string[] = [];
  tells.on("data", (d) => {
    result.push(d);
  });
  return new Promise<string[]>((resolve, reject) =>
    pipeline(readable, new LineTransformer(), tells, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    })
  );
}

describe("Tell filter testing", () => {
  test("No tells", async () => {
    const result = await processTells(NO_TELL_TEXT);
    assert.equal(result.length, 0, "Should not be any tells");
  });

  test("Single line tells", async () => {
    const result = await processTells(SINGLE_LINE_TELL_TEXT);
    assert.equal(result.length, 4, "Missing single line tells");
    console.debug("Single Line Tells", result);
  });

  test("Multi line tells", async () => {
    const result = await processTells(MULTI_LINE_TELL_TEXT);
    assert.equal(result.length, 6, "Missing multi line tells");
    console.debug("Multi Line Tells", result);
  });
});

const LOGIN_TEXT = [
  `
  .            .   .
  .            - ~~~~T          .
      .   ~ -~~~ ~-~~|             .
  Welcome to...         .        ~  -~~~~~|  .   *   .
       .     .    .  |       .         .
  _,           .      .     __ .  _|_  .  __     .
  /||                *     . {__|__| _ |__ |__}.
  / ||              .          |__ |_____|__ _|   .
  /==|| n c i e n t       .    . |_|_ |_ |__|_|  .                A Realtime
  /   || n g u i s h          .    |_|___|__|_|      Multiuser Adventure Game
`,
  `(    \\,                       .  |_ |_ _|___|  .
                |___|____|_|      LPMud 3.2.1@141 (Native)
  
`,
  `Use Guest if you just want to look around.
  
`,
  `What is your name: Password: ��
`,
  `Welcome back to YOUR /\_ncient /\_nguish                  
  
`,
  ` --== Founders: Zor, Drake ==--                       
  --== Arch Wizards: Angstrom, Buxley, Ixnay, Krystal, Malire ==--
  --== Ministers: Bytre ==--  
  
  
`,
  `You can read the old news by typing 'oldnews'.
  
`,
  `Your last login was 1 minute and 31 seconds ago.
`,
];

const LOGOUT_TEXT = [
  `> You walk up to the desk to check into a room for the night, leaving any
remaining equipment behind for other adventurers to use.
`,
  `Saving Deadmeat.
`,
  `Closing down.
`,
];

const NO_TELL_TEXT = [
  ...LOGIN_TEXT,
  `A player usage graph.
��> ==============================================================================
Currently 9 players are playing Ancient Anguish!
==============================================================================
There is one Senator playing:
-----------------------------
Angstrom     [Arch of Mudlib, Law Assistant]

There are 8 Mortals playing:
----------------------------
Aladar     Bazhi      Cdc        Deadmeat   Sharp      Sicko      Snorky
Varulven

`,
  `> 
`,
  `Just a Serf  

Status: Creator                          Gender: Male

He is not logged in.
`,
  `> There is no such player in the world right now.
`,
  ...LOGOUT_TEXT,
];

const SINGLE_LINE_TELL_TEXT = [
  ...LOGIN_TEXT,
  `Someone tells you: Single Line 1
`,
  `Someone tells you: Single Line 2
`,
  `> Someone tells you: Single Line 3
`,
  `Someone tells you: Single Line 4
`,
  ...LOGOUT_TEXT,
];

const MULTI_LINE_TELL_TEXT = [
  ...LOGIN_TEXT,
  `Someone tells you: Multi Line 1
                      Multi Line 2
`,
  `Someone tells you: Multi Line 1
                      Multi Line 2
                      Multi Line 3
`,
  `Someone tells you: Multi Line 1
                      Multi Line 2
                      Multi Line 3
                      Multi Line 4
`,
  `> Someone tells you: Multi Line 1
                      Multi Line 2
                      Multi Line 3
                      Multi Line 4
`,
  `Someone tells you: Multi Line 1
                      Multi Line 2
`,
  `                   Broken Multi Line 3
                      Multi Line 4
`,
  `Someone tells`,
  ` you: Broken Line 1
                      Multi Line 2
`,
  `                   Broken Multi `,
  `Broken Line 3
`,
  `                   Broken Multi Line 4
`,
  `Something else`,
  ...LOGOUT_TEXT,
];
