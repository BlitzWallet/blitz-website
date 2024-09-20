"use strict";
import "dotenv/config";
import { decryptMessage, encryptMessage } from "../middleware/newEncription";

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const encripted = await encryptMessage(
      "8876b7373c2550bb02b7dc939b13878ee53983fe329949e513ad7f272bec8b41",
      process.env.DB_PUBKEY,
      "TESTING"
    );
    console.log(encripted);
    const decrypted = await decryptMessage(
      process.env.DB_PRIVKEY,
      "2ca429d9de283be570106ccfcd0fc201da223a063d1e26f7e2bb496f944b8de3",
      encripted
    );
    console.log(decrypted);
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: { decrypted, encripted },
      }),
    };

    const token = await signIn();
    return {
      statusCode: 200,
      body: JSON.stringify({
        data: { token: token },
      }),
    };
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "ERROR",
        reason: "Must be a post request",
      }),
    };
}
