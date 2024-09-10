"use strict";
import "dotenv/config";
import { signIn } from "../db";
import { decrypt } from "../middleware/encription";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const postData = event.body ? JSON.parse(event.body) : null; //sanitation
    const decrypted = decrypt(postData);

    console.log(decrypted);
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "ERROR",
        reason: "Must be a post request",
      }),
    };
}
