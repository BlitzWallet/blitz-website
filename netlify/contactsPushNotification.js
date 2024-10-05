"use strict";
import "dotenv/config";
import { decrypt } from "../middleware/encription";
import { sendContactNotification } from "../middleware/sendContactNotification";

export async function handler(event, context) {
  const data = event.body ? JSON.parse(event.body) : null; //sanitation
  if (event.httpMethod === "POST") {
    try {
      const devicePushKey = data.devicePushKey;
      const deviceType = data.deviceType;
      const message = data.message;

      const decryptedPushKey =
        process.env.ENVIRONMENT === "testnet"
          ? process.env.NOTIFICATIONS_KEY
          : decrypt(devicePushKey);

      console.log(decryptedPushKey, deviceType, message);

      sendContactNotification({
        devicePushKey: decryptedPushKey,
        deviceType: deviceType,
        message: message,
      });
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
