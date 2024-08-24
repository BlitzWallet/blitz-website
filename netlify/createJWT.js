"use strict";
import "dotenv/config";

import jwt from "jsonwebtoken";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation
    try {
      const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "2h",
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ token: token }),
      };
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Error creating token" }),
      };
    } // // JSON WEB TOKEN
  } else
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Must be a post request" }),
    };
}
