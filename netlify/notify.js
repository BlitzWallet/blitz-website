"use strict";
import "dotenv/config";
import { Expo } from "expo-server-sdk";
import { getSignleContact } from "../db";
import { decrypt } from "../middleware/encription";
import { decryptMessage } from "../middleware/newEncription";

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
      if (!contact.length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Unable to get contact" }),
        };
      }
      const [retrivedContact] = contact;
      if (!retrivedContact?.pushNotifications?.key?.encriptedText) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            status: "ERROR",
            reason: "User does not have push notifications turned on",
          }),
        };
      }
      const handleDecryption =
        typeof retrivedContact.pushNotifications.key.encriptedText === "string"
          ? decryptMessage(
              process.env.BACKEND_PRIV_KEY,
              retrivedContact.uuid,
              retrivedContact.pushNotifications.key.encriptedText
            )
          : Promise.resolve(
              decrypt(retrivedContact.pushNotifications.key.encriptedText)
            );

      const devicePushKey = await handleDecryption;

      if (!devicePushKey.didWork) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Unable to decrypt push token",
            message: devicePushKey.error,
          }),
        };
      }

      // return {
      //   statusCode: 200,
      //   body: JSON.stringify({
      //     uuid: retrivedContact.uuid,
      //     text: retrivedContact.pushNotifications.key.encriptedText,
      //     pushKey: devicePushKey,
      //     Parameters: Parameters,
      //     pushKeyType:
      //       typeof retrivedContact.pushNotifications.key.encriptedText,
      //   }),
      // };
      const messages =
        Parameters?.platform?.toLowerCase() === "ios"
          ? [
              {
                to: `${devicePushKey.text}`,
                sound: "default",
                body: "Handling payment in the background",
                _contentAvailable: true,
              },
            ]
          : [
              {
                to: `${devicePushKey.text}`,
                sound: "default",
                body: "Handling payment in the background",
              },
            ];
      const [response] = await expo.sendPushNotificationsAsync(messages);
      console.log("Push notification response:", response);
      return {
        statusCode: 200,
        body: JSON.stringify({
          error: "Working",
          responseStatus: response.status,
          id: response.id,
          errorMessage: JSON.stringify(response.details),
        }),
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
