// "use strict";
// import "dotenv/config";
// import { Expo } from "expo-server-sdk";

// let expo = new Expo({ accessToken: process.env.PUSH_NOTIFICATION_SECRET });

// export async function handler(event, context) {
//   if (event.httpMethod === "POST") {
//     const Parameters = event.queryStringParameters
//       ? event.queryStringParameters
//       : null;
//     const Data = event.body ? JSON.parse(event.body) : null; //sanitation

//     if (!Data || !Parameters)
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ error: "Error with request" }),
//       };
//     try {
//       await expo.sendPushNotificationsAsync([
//         {
//           to: `${Parameters.token}`,
//           sound: "default",
//           // aps: {
//           //   "content-available": 1,
//           // },
//           _contentAvailable: true,
//           mutableContent: true,
//           priority: "high",
//           // title: "Blitz Wallet",
//           // body: `Sent from Backend`,
//           data: Data,
//         },
//       ]);
//       return {
//         statusCode: 200,
//         body: JSON.stringify({ error: "Working" }),
//       };
//     } catch (err) {
//       console.log(err);
//       return {
//         statusCode: 200,
//         body: JSON.stringify({ error: "Error" }),
//       };
//     }
//   } else {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: "Must be a post request" }),
//     };
//   }
// }
