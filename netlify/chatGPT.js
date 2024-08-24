"use strict";
import "dotenv/config";
import OpenAI from "openai";
import { JWTAuth } from "../middleware/JWTAuth";

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation
    const token = event.headers.authorization;

    const isAuthenticated = JWTAuth(token);

    if (!token)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Error no authentication token provided",
        }),
      };

    if (!isAuthenticated)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Incorrect authenticatoin token",
        }),
      };

    try {
      const completion = await openai.chat.completions.create({
        messages: Data.messages,
        model: "gpt-4o",
      });

      return {
        statusCode: 200,
        body: JSON.stringify(completion),
      };
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify(err),
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
