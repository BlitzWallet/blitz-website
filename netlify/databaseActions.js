"use strict";
import "dotenv/config";
import { signIn } from "../db";
import { decrypt } from "../middleware/encription";
import { decryptMessage } from "../middleware/newEncription";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const postData = event.body ? JSON.parse(event.body) : null; //sanitation
    const decryptedContent = decryptMessage(
      process.env.DB_PRIVKEY,
      postData.pubKey,
      postData.content
    );

    console.log(decryptedContent);
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "ERROR",
        reason: "Must be a post request",
      }),
    };
}
