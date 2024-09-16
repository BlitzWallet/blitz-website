"use strict";
import "dotenv/config";
import { JWTAuth } from "../middleware/JWTAuth";
import { decryptMessage, encryptMessage } from "../middleware/newEncription";
import e from "express";

const serverURL =
  process.env.BOLTZ_ENVIRONMENT === "liquid"
    ? "https://api.thebitcoincompany.com"
    : "https://api.dev.thebitcoincompany.com";
export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    try {
      const postData = event.body ? JSON.parse(event.body) : null; //sanitation
      const token = event.headers.authorization;
      //   const decryptedContent = JSON.parse(
      //     await decryptMessage(
      //       process.env.DB_PRIVKEY,
      //       postData.pubKey,
      //       postData.content
      //     )
      //   );

      const isAuthenticated = JWTAuth(token);

      if (postData.type === "listGiftCards") {
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
      } else if (postData.type === "signUp") {
        try {
          const response = await fetch(`${serverURL}/auth/sign-up`, {
            method: "POST",
            body: JSON.stringify({
              email: postData.email,
              password: postData.password,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();
          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          //   const encriptedContact = encryptMessage(
          //     process.env.DB_PRIVKEY,
          //     userPubKey,
          //     JSON.stringify(data)
          //   );
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          console.log(err, "TESt");
          return {
            statusCode: 400,
            body: JSON.stringify(err),
          };
        }
      } else if (postData.type === "login") {
        try {
          const response = await fetch(`${serverURL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({
              email: postData.email,
              password: postData.password,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();
          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          //   const encriptedContact = encryptMessage(
          //     process.env.DB_PRIVKEY,
          //     userPubKey,
          //     JSON.stringify(data)
          //   );
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          console.log(err, "TESt");
          return {
            statusCode: 400,
            body: JSON.stringify(err),
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
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Error getting options",
        }),
      };
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error getting options",
      }),
    };
  }
}