"use strict";
import "dotenv/config";
import { decrypt } from "../middleware/encription";
import { sendContactNotification } from "../middleware/sendContactNotification";
import { JWTAuth } from "../middleware/JWTAuth";
import { Expo } from "expo-server-sdk";

let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export async function handler(event, context) {
  const data = event.body ? JSON.parse(event.body) : null; //sanitation
  if (event.httpMethod === "POST") {
    try {
      if (!data)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Must have a body",
          }),
        };
      if (!data.token)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "",
          }),
        };

      const isAuthenticated = JWTAuth(data.token);

      if (!isAuthenticated)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Incorrect authenticatoin token",
          }),
        };
      const devicePushKey = data.devicePushKey;
      const deviceType = data.deviceType;
      const message = data.message;

      const decryptedPushKey =
        process.env.ENVIRONMENT === "testnet"
          ? process.env.NOTIFICATIONS_KEY
          : decrypt(devicePushKey);

      console.log(decryptedPushKey, deviceType, message);
      const messages =
        deviceType === "ios"
          ? [
              {
                to: `${decryptedPushKey}`,
                sound: "default",
                body: message,
                // _contentAvailable: true,
                badge: 1,
              },
            ]
          : [
              {
                to: `${decryptedPushKey}`,
                sound: "default",
                body: message,
              },
            ];

      const response = await expo.sendPushNotificationsAsync(messages);
      console.log("Push notification response:", response);

      // sendContactNotification({
      //   devicePushKey: decryptedPushKey,
      //   deviceType: deviceType,
      //   message: message,
      // });
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "SUCCESS",
        }),
      };
    } catch (err) {
      console.log(err);
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
