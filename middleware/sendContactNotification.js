import * as admin from "firebase-admin";
import * as apn from "apn";
import { google } from "googleapis"; // Google API library for authentication
import { Expo } from "expo-server-sdk";

let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

var serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Set up the APNs provider with your key
const apnProvider = new apn.Provider({
  token: {
    key: process.env.APPLE_KEY, // Path to the .p8 key file
    keyId: process.env.APN_KEY_ID, // Key ID from Apple Developer Account
    teamId: process.env.APN_TEAM_ID, // Team ID from Apple Developer Account
  },
  production: true,
});

export function sendContactNotification({
  devicePushKey,
  deviceType,
  message,
}) {
  if (!Expo.isExpoPushToken(devicePushKey)) return;

  expo.sendPushNotificationsAsync([
    {
      to: `${devicePushKey}`,
      sound: "default",
      // aps: {
      //   "content-available": 1,
      // },
      _contentAvailable: true,
      mutableContent: true,
      priority: "high",
      // title: "Blitz Wallet",
      // body: { pr: userData.pr },
      body: message,
    },
  ]);

  return;
  if (deviceType.toLowerCase() === "ios") {
    // Send a message to the device corresponding to the provided registration token
    // Create a notification
    let notification = new apn.Notification({
      alert: {
        title: message,
      },
      topic: "org.reactjs.native.example.BlitzWallet", // Replace with your app's bundle identifier
    });

    // Send the notification
    apnProvider
      .send(notification, devicePushKey) // Replace with the device token
      .then((result) => {
        console.log(result.failed, "RESULT");
        apnProvider.shutdown();
      })
      .catch((err) => {
        console.error(err, "ERROR");
      });

    return;
  } else {
    sendNotification(devicePushKey, message);
  }
}

// Function to get access token using service account key
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const token = await auth.getAccessToken();
  return token;
}

// Function to send FCM notification
async function sendNotification(devicePushKey, globalMessage) {
  try {
    // Message payload
    const message = {
      message: {
        token: devicePushKey, // FCM token of the device to send notification to
        notification: {
          title: globalMessage,
        },
      },
    };
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();
    if (response.ok) {
      console.log("Notification sent successfully:", result);
    } else {
      console.error("Failed to send notification:", result.error);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
