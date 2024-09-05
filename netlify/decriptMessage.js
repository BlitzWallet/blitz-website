"use strict";
import "dotenv/config";
import { decrypt } from "../middleware/encription";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation
    if (!Data)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error with request" }),
      };

    const decrypted = decrypt(Data.encriptedText);

    return {
      statusCode: 200,
      body: JSON.stringify({ decryptedText: decrypted }),
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
}
