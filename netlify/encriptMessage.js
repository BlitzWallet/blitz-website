"use strict";
import "dotenv/config";
import { decrypt, encrypt } from "../middleware/encription";
import { verifyAppCheckToken } from "../middleware/verifyAppCheckToken";

export async function handler(event, context) {
  try {
    // const appCheckToken = event.headers["x-firebase-appcheck"];

    // await verifyAppCheckToken(appCheckToken);
    if (event.httpMethod === "POST") {
      const Data = event.body ? JSON.parse(event.body) : null; //sanitation
      if (!Data)
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Error with request" }),
        };

      const encriptedKey = encrypt(Data.text);

      return {
        statusCode: 200,
        body: JSON.stringify({ encriptedText: encriptedKey }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "ERROR",
          reason: "Must be a post request",
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Not authenticated" }),
    };
  }
}
