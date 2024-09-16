"use strict";
import "dotenv/config";
import { JWTAuth } from "../middleware/JWTAuth";
import { decryptMessage } from "../middleware/newEncription";

const serverURL =
  process.env.BOLTZ_ENVIRONMENT === "liquid"
    ? "https://api.thebitcoincompany.com"
    : "https://api.dev.thebitcoincompany.com";
export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const postData = event.body ? JSON.parse(event.body) : null; //sanitation
    const token = event.headers.authorization;
    const decryptedContent = JSON.parse(
      await decryptMessage(
        process.env.DB_PRIVKEY,
        postData.pubKey,
        postData.content
      )
    );

    const isAuthenticated = JWTAuth(token);

    if (decryptedContent.type === "listGiftCards") {
      try {
        const response = await fetch(`${serverURL}/giftcards`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        return {
          statusCode: 200,
          body: JSON.stringify({
            giftCards: data.result.svs,
          }),
        };
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Error getting options",
          }),
        };
      }
    } else if (decryptedContent.type === "signUp") {
      try {
        const response = await fetch(`${serverURL}/auth/sign-up`, {
          method: "POST",
          body: JSON.stringify({
            email: decryptedContent.email,
            password: decryptedContent.password,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        return {
          statusCode: 200,
          body: JSON.stringify({
            response: data.result,
          }),
        };
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Error getting options",
          }),
        };
      }
    }
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

    return {
      statusCode: 200,
      body: JSON.stringify("WORKIGN"),
    };
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error getting options",
      }),
    };
  }
}
