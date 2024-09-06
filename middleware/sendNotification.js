import * as admin from "firebase-admin";
import * as apn from "apn";
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
  production: false, // Set to true for production environment
});

export function sendNotification({
  devicePushKey,
  deviceType,
  amount,
  swapInfo,
  privateKey,
  preimage,
  liquidAddress,
}) {
  if (deviceType.toLowerCase() === "ios") {
    // Send a message to the device corresponding to the provided registration token
    // Create a notification
    let notification = new apn.Notification({
      alert: {
        title: `Click to claim swap`,
      },
      topic: "org.reactjs.native.example.BlitzWallet", // Replace with your app's bundle identifier
      payload: {
        swapInfo,
        privateKey,
        preimage,
        liquidAddress,
      },
      contentAvailable: 1,
      // aps: {
      //   "content-available": 1, // This makes it a background notification
      //   // sound: "default", // Optional: adds sound to notification
      //   // badge: 1, // Optional: adds badge to the app icon
      // },
    });

    // Send the notification
    apnProvider
      .send(notification, devicePushKey) // Replace with the device token
      .then((result) => {
        console.log(result);
        apnProvider.shutdown();
      })
      .catch((err) => {
        console.error(err);
      });

    return;
  } else {
    const message = {
      notification: {
        title: `Receiving ${amount} sats`,
      },
      token: devicePushKey, // Replace with the device token
      contentAvailable: 1,
    };
    admin
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  }
}
