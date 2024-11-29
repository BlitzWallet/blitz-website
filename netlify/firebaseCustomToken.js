"use strict";
import "dotenv/config";

import { JWTAuth } from "../middleware/JWTAuth";
import { initializeFirebase } from "../db";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation
    const token = event.headers.authorization;

    // const isAuthenticated = JWTAuth(token);

    // if (!token)
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({
    //       error: "Error no authentication token provided",
    //     }),
    //   };

    // if (!isAuthenticated)
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({
    //       error: "Incorrect authenticatoin token",
    //     }),
    //   };
    if (Data?.checkvalue != process.env.UNIQUE_BLITZ_VALUE) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Error no authentication token provided",
        }),
      };
    }
    try {
      const { admin } = await initializeFirebase();
      const token = await admin
        .appCheck()
        .createToken(process.env.ANDROID_APP_ID, {
          ttlMillis: 24 * 60 * 60 * 1000,
        });

      return {
        statusCode: 200,
        body: JSON.stringify(token),
      };
    } catch (err) {
      console.log(err);
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
