"use strict";
import "dotenv/config";
import { JWTAuth } from "../middleware/JWTAuth";

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
      return {
        statusCode: 200,
        body: JSON.stringify(process.env.FIREBASE_AUTH_CODE),
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
