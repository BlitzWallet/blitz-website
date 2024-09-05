"use strict";
import "dotenv/config";
import { getSignleContact } from "../db";
import createLNtoLiquidSwap from "../middleware/createLNtoLiquidSwap";
import sendNotification from "../middleware/sendNotification";

import { decrypt } from "../middleware/encription";

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation
    try {
      const pathParts = event.path.split("/");
      const username = pathParts[pathParts.length - 1];
      const queryParams = event.queryStringParameters;

      if (Object.keys(queryParams).length === 0) {
        const swapRates = await (
          await fetch(`${process.env.BOLTZ_API_URL}swap/reverse`)
        ).json();
        const limits = swapRates["BTC"]["L-BTC"].limits;
        return {
          statusCode: 200,
          body: JSON.stringify({
            callback: `https://blitz-wallet.com/.netlify/functoins/lnurlp/${username}`, // The URL from LN SERVICE which will accept the pay request parameters
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
      } else {
        const receiveAmount = queryParams.amount;

        // const payingContact = {};
        const [payingContact] = await getSignleContact(username.toLowerCase());
        // console.log(queryParams);

        const receiveAddress =
          payingContact["contacts"].myProfile.receiveAddress;
        //  process.env.TESTET_ADDRESS;

        if (!payingContact?.pushNotifications?.key?.encriptedText) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "User does not have push notifications turned on",
            }),
          };
        }

        const devicePushKey = decrypt(
          payingContact.pushNotifications.key.encriptedText
        );
        // process.env.NOTIFICATIONS_KEY;
        const deviceType = payingContact.pushNotifications.platform;
        //  "ios"
        const createdResponse = await createLNtoLiquidSwap(
          receiveAmount,
          receiveAddress
        );

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
          statusCode: 400,
          body: JSON.stringify({
            pr: createdResponse.createdResponse.invoice, // bech32-serialized lightning invoice
            routes: [], // an empty array
          }),
        };
      }
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
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "ERROR",
        reason: "Must be a post request",
      }),
    };
}
