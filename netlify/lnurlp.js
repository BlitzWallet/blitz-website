"use strict";
import "dotenv/config";
import { getSignleContact } from "../db";
import { createLNtoLiquidSwap } from "../middleware/createLNtoLiquidSwap";
import { sendNotification } from "../middleware/sendNotification";

import { decrypt } from "../middleware/encription";

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation
    const pathParts = event.path.split("/");
    const username = pathParts[pathParts.length - 1];
    const queryParams = event.queryStringParameters;
    if (Object.keys(queryParams).length === 0) {
      try {
        const swapRates = await (
          await fetch(`${process.env.BOLTZ_API_URL}swap/reverse`)
        ).json();
        const limits = swapRates["BTC"]["L-BTC"].limits;
        return {
          statusCode: 200,
          body: JSON.stringify({
            callback: `https://blitz-wallet.com/.well-known/lnurlp/${username}`, // The URL from LN SERVICE which will accept the pay request parameters
            maxSendable: limits.maximal * 1000, // Max millisatoshi amount LN SERVICE is willing to receive
            minSendable: limits.minimal * 1000, // Min millisatoshi amount LN SERVICE is willing to receive, can not be less than 1 or more than `maxSendable`
            metadata: JSON.stringify([
              [
                "text/plain", // mandatory,
                `Pay to ${username}`, // short description displayed when paying and in transaction log
              ],
            ]), //
            tag: "payRequest", // Type of LNURL
          }),
        };
      } catch (err) {
        console.log(err);
        return {
          statusCode: 400,
          body: JSON.stringify({
            status: "ERROR",
            reason: "Error getting invoice reqirements",
          }),
        };
      }
    } else {
      try {
        let payingContact = {};
        if (!queryParams.amount) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "No amount provided",
            }),
          };
        }

        if (process.env.ENVIRONMENT != "testnet") {
          payingContact = await getSignleContact(username.toLowerCase());
          if (!payingContact) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                status: "ERROR",
                reason: "Error getting pay information",
              }),
            };
          }

          if (!payingContact[0]?.pushNotifications?.key?.encriptedText) {
            return {
              statusCode: 400,
              body: JSON.stringify({
                status: "ERROR",
                reason: "User does not have push notifications turned on",
              }),
            };
          }
        }

        const receiveAmount = Math.round(queryParams.amount / 1000);
        const receiveAddress =
          process.env.ENVIRONMENT === "testnet"
            ? process.env.TESTET_ADDRESS
            : payingContact[0]["contacts"].myProfile.receiveAddress;

        const devicePushKey =
          process.env.ENVIRONMENT === "testnet"
            ? process.env.NOTIFICATIONS_KEY
            : decrypt(payingContact[0].pushNotifications.key.encriptedText);

        const deviceType =
          process.env.ENVIRONMENT === "testnet"
            ? "ios"
            : payingContact[0].pushNotifications.platform;

        if (!devicePushKey || !deviceType || !receiveAddress) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Error getting pay information",
            }),
          };
        }

        const createdResponse = await createLNtoLiquidSwap(
          receiveAmount,
          receiveAddress,
          username
        );

        console.log({
          devicePushKey: devicePushKey,
          deviceType: deviceType,
          amount: receiveAmount,
          swapInfo: createdResponse.createdResponse,
          privateKey: createdResponse.keys.privateKey.toString("hex"),
          preimage: createdResponse.preimage.toString("hex"),
          liquidAddress: receiveAddress,
        });
        if (createdResponse.createdResponse.error) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: createdResponse.createdResponse.error,
            }),
          };
        }

        sendNotification({
          devicePushKey: devicePushKey,
          deviceType: deviceType,
          amount: receiveAmount,
          swapInfo: createdResponse.createdResponse,
          privateKey: createdResponse.keys.privateKey.toString("hex"),
          preimage: createdResponse.preimage.toString("hex"),
          liquidAddress: receiveAddress,
        });

        return {
          statusCode: 200,
          body: JSON.stringify({
            pr: createdResponse.createdResponse.invoice, // bech32-serialized lightning invoice
            routes: [], // an empty array
          }),
        };
      } catch (err) {
        console.log(err);
        return {
          statusCode: 400,
          body: JSON.stringify({
            status: "ERROR",
            reason: "Error creating invoice",
          }),
        };
      } // // JSON WEB TOKEN
    }
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "ERROR",
        reason: "Must be a post request",
      }),
    };
}
