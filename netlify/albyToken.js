"use strict";
import "dotenv/config";
// import { sha256 } from "liquidjs-lib/src/crypto";
// import Crypto from "crypto";
import Ably from "ably";
import verifyAppCheckToken from "../middleware/verifyAppCheckToken";
const realtime = new Ably.Realtime(process.env.ABLY_API_KEY);

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    try {
      // const appCheckToken = event.headers["x-firebase-appcheck"];

      // await verifyAppCheckToken(appCheckToken);
      const authToken = await realtime.auth.createTokenRequest();

      //  function (err, tokenRequest ) {
      //   if (err) {
      //     return {
      //       statusCode: 500,
      //       body: "Error requesting token: " + JSON.stringify(err),
      //     };
      //   } else {
      //     // return the token request to the front-end client
      //     return {
      //       statusCode: 200,
      //       body: tokenRequest,
      //     };
      //   }
      // });

      if (authToken) {
        return {
          statusCode: 200,
          body: JSON.stringify(authToken),
        };
      } else {
        return {
          statusCode: 500,
          body: "ERROR",
        };
      }
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify(authToken),
      };
    }
  }
}
