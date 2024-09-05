"use strict";
import "dotenv/config";
import { decrypt, encrypt } from "../middleware/encription";

export async function handler(event, context) {
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
}
