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
      let payingContact = await getSignleContact(username.toLowerCase());

      try {
        if (!queryParams.amount) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "No amount provided",
            }),
          };
        }

        // const payingContact = {};

        if (!payingContact) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Error getting pay information",
            }),
          };
        }
        // console.log(queryParams);

        if (!payingContact[0]?.pushNotifications?.key?.encriptedText) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "User does not have push notifications turned on",
            }),
          };
        }

        const receiveAmount = Math.round(queryParams.amount / 1000);
        const receiveAddress =
          payingContact[0]["contacts"].myProfile.receiveAddress;
        //  process.env.TESTET_ADDRESS;

        const devicePushKey = decrypt(
          payingContact[0].pushNotifications.key.encriptedText
        );
        // process.env.NOTIFICATIONS_KEY;
        const deviceType = payingContact[0].pushNotifications.platform;
        //  "ios"

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
          receiveAddress
        );
        if (!createdResponse) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Not able to create invoice",
            }),
          };
        }

        sendNotification({
          devicePushKey: devicePushKey,
          deviceType: deviceType,
          amount: receiveAmount,
          swapInfo: createdResponse.createdResponse,
          privateKey: createdResponse.keys.privateKey.toString("hex"),
          preimage: createdResponse.preimage,
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
