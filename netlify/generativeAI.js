"use strict";
import "dotenv/config";

import { JWTAuth } from "../middleware/JWTAuth";
import { verifyAppCheckToken } from "../middleware/verifyAppCheckToken";

// claude-3.5-sonnet
// gpt-4o
// llama-3.1-405b-instruct
// llama-3-70b-instruct
// gpt-4o-mini
// gemini-flash-1.5
// mixtral-8x7b-instruct

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation
    const token = event.headers.authorization;

    try {
      const appCheckToken = event.headers["x-firebase-appcheck"];

      if (appCheckToken) await verifyAppCheckToken(appCheckToken);
      const isAuthenticated = appCheckToken ? true : JWTAuth(token);

      if (!isAuthenticated)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Incorrect authenticatoin token",
          }),
        };

      try {
        const url = "https://api.ppq.ai/chat/completions";
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GENERATIVE_AI_KEY}`,
        };

        //   const data = {
        //     model: "claude-3.5-sonnet",
        //     messages: [{ role: "user", content: "Hello, how are you?" }],
        //   };

        const response = await fetch(url, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(Data.data),
        });
        const responseData = await response.json();

        return {
          statusCode: 200,
          body: JSON.stringify(responseData),
        };
      } catch (err) {
        console.log(err);
        return {
          statusCode: 400,
          body: JSON.stringify(err),
        };
      }
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Not authenticated",
          realError: String(err),
        }),
      };
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Must be a post request",
      }),
    };
  }
}
