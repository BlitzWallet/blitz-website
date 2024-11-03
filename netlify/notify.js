"use strict";
import "dotenv/config";
import { Expo } from "expo-server-sdk";
import { getSignleContact } from "../db";
import { decrypt } from "../middleware/encription";

let expo = new Expo({ accessToken: process.env.PUSH_NOTIFICATION_SECRET });

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const Parameters = event.queryStringParameters
      ? event.queryStringParameters
      : null;
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation

    console.log(Parameters);

    if (!Data || !Parameters)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error with request" }),
      };
    try {
      const contact = await getSignleContact(
        "blitzWalletUsers",
        Parameters.token.toLowerCase()
      );
      if (!contact[0]?.pushNotifications?.key?.encriptedText) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            status: "ERROR",
            reason: "User does not have push notifications turned on",
          }),
        };
      }
      const devicePushKey = decrypt(
        contact[0].pushNotifications.key.encriptedText
      );
      await expo.sendPushNotificationsAsync([
        {
          to: `${devicePushKey}`,
          sound: "default",
          // aps: {
          //   "content-available": 1,
          // },
          _contentAvailable: true,
          mutableContent: true,
          priority: "high",
          title: "Blitz Wallet",

          body: "Handling payment in the background",
          data: Data,
        },
      ]);
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "Working" }),
      };
    } catch (err) {
      console.log(err);
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "Error" }),
      };
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Must be a post request" }),
    };
  }
}
