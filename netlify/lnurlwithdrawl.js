"use strict";
import "dotenv/config";
import { Expo } from "expo-server-sdk";

import {
  addDataToCollection,
  // deleteDataFromCollection,
  getDataFromCollection,
} from "../db";
import { decrypt, encrypt } from "../middleware/encription";

let expo = new Expo({ accessToken: process.env.PUSH_NOTIFICATION_SECRET });

export async function handler(event, context) {
  return {
    statusCode: 400,
    body: JSON.stringify({
      status: "ERROR",
      reason: "This is not ready yet",
    }),
  };
  if (event.httpMethod === "GET") {
    const Parameters = event.queryStringParameters
      ? event.queryStringParameters
      : null;
    if (!Parameters)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error with request" }),
      };
    const didSendAlready = await getDataFromCollection(
      "BlitzWalletLNURLWithdrawl",
      Parameters?.uuid || Parameters?.k1
    );

    if (
      !(
        didSendAlready &&
        !(didSendAlready.totalAmountToSend > didSendAlready.amountSent)
      )
    ) {
      if (!Parameters.pr) {
        try {
          let returnOBJ = {};
          const callbackURL = `https://blitz-wallet.com/.netlify/functions/lnurlwithdrawl`;

          returnOBJ["tag"] = "withdrawRequest";
          returnOBJ["callback"] = callbackURL;
          returnOBJ["k1"] = Parameters.uuid;
          returnOBJ["defaultDescription"] = Parameters?.desc || `bwsfd`;
          returnOBJ["maxWithdrawable"] = Parameters.amount * 1000;
          returnOBJ["minWithdrawable"] = Parameters.amount * 1000;

          let savingData = {
            k1: Parameters.uuid,
            pushToken: Parameters.token,
            totalAmountToSend: Number(Parameters.totalAmount),
            amountSent:
              typeof didSendAlready.amountSent === "number"
                ? didSendAlready.amountSent + 1
                : 0,
          };

          const didSave = await addDataToCollection(
            savingData,
            "BlitzWalletLNURLWithdrawl",
            Parameters.uuid
          );

          if (didSave) {
            return {
              statusCode: 200,
              body: JSON.stringify(returnOBJ),
            };
          } else {
            return {
              statusCode: 400,
              body: JSON.stringify({
                status: "ERROR",
                reason: "Error when trying to create return object",
              }),
            };
          }
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: JSON.stringify({ errorMessage: err }),
            }),
          };
        }
      } else {
        try {
          const savedData = await getDataFromCollection(
            "BlitzWalletLNURLWithdrawl",
            Parameters.k1
          );
          await expo.sendPushNotificationsAsync([
            {
              to: `${savedData.pushToken}`,
              sound: "default",
              // aps: {
              //   "content-available": 1,
              // },
              _contentAvailable: true,
              mutableContent: true,
              priority: "high",
              // title: "Blitz Wallet",
              // body: { pr: userData.pr },

              data: { pr: Parameters.pr },
            },
          ]);

          let savingData = {
            ...savedData,
            amountSent: savedData.amountSent + 1,
          };

          const didSave = await addDataToCollection(
            savingData,
            "BlitzWalletLNURLWithdrawl",
            Parameters.k1
          );

          if (didSave) {
            return {
              statusCode: 200,
              body: JSON.stringify({ status: "OK" }),
            };
          } else {
            return {
              statusCode: 400,
              body: JSON.stringify({
                status: "ERROR",
                reason: "Error when sending payment",
                hash: decrypt(savedData.pushToken),
              }),
            };
          }
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Error sending notification",
            }),
          };
        }
      }
    } else {
      didSendAlready?.pushToken &&
        (await deleteDataFromCollection(
          "BlitzWalletLNURLWithdrawl",
          Parameters.k1
        ));

      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "ERROR",
          reason: "Withdrawl has already been accepted",
        }),
      };
    }
  }
}
