"use strict";
import "dotenv/config";
import { decrypt } from "../middleware/encription";
import { sendContactNotification } from "../middleware/sendContactNotification";
import { JWTAuth } from "../middleware/JWTAuth";
import { Expo } from "expo-server-sdk";
import verifyAppCheckToken from "../middleware/verifyAppCheckToken";
import { decryptMessage } from "../middleware/newEncription";

let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

export async function handler(event, context) {
  const data = event.body ? JSON.parse(event.body) : null; //sanitation
  if (event.httpMethod === "POST") {
    try {
      const appCheckToken = event.headers["x-firebase-appcheck"];

      if (appCheckToken) await verifyAppCheckToken(appCheckToken);
      if (!data)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Must have a body",
          }),
        };

      const isAuthenticated = appCheckToken ? true : JWTAuth(data.token);

      if (!isAuthenticated)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Incorrect authenticatoin token",
          }),
        };
      const devicePushKey = data.devicePushKey;
      const decryptPubKey = data?.decryptPubKey;
      const deviceType = data.deviceType;
      const message = data.message;

      const decryptedPushKey =
        typeof devicePushKey != "string"
          ? Promise.resolve(decrypt(devicePushKey))
          : decryptMessage(
              process.env.BACKEND_PRIV_KEY,
              decryptPubKey,
              devicePushKey
            );
      const handledDecryptPromise = await decryptedPushKey;

      console.log(handledDecryptPromise, deviceType, message);
      const messages =
        deviceType === "ios"
          ? [
              {
                to: `${handledDecryptPromise}`,
                sound: "default",
                body: message,
                // _contentAvailable: true,
                badge: 1,
              },
            ]
          : [
              {
                to: `${handledDecryptPromise}`,
                sound: "default",
                body: message,
              },
            ];

      const response = await expo.sendPushNotificationsAsync(messages);
      console.log("Push notification response:", response);

      // sendContactNotification({
      //   devicePushKey: handledDecryptPromise,
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
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "ERROR",
          reason: String(err),
        }),
      };
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
