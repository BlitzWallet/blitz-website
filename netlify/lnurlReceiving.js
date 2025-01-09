"use strict";
import "dotenv/config";
import { Expo } from "expo-server-sdk";
import { MongoClient, ServerApiVersion } from "mongodb";
const uri = `mongodb+srv://${process.env.dbUser}:${process.env.dbPass}@${process.env.dpUser}.zgq19jn.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri);
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
    const Data = event.body ? JSON.parse(event.body) : null; //sanitation
    if (!Parameters)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error with request" }),
      };
    await client.connect();
    if (!Parameters.pr) {
      try {
        const database = client.db("BlitzWalletLNURLWithdrawl");
        const collection = database.collection("currentLNURL");

        let returnOBJ = {};
        const callbackURL = `https://blitz-wallet.com/.netlify/functions/lnurlwithdrawl`;

        returnOBJ["tag"] = "withdrawRequest";
        returnOBJ["callback"] = callbackURL;
        returnOBJ["k1"] = Parameters.uuid.split("-")[0];
        returnOBJ["defaultDescription"] = `bwsfd`;
        returnOBJ["maxWithdrawable"] = Parameters.amount * 1000;
        returnOBJ["minWithdrawable"] = Parameters.amount * 1000;

        let savingData = {
          k1: Parameters.uuid.split("-")[0],
          pushToken: Parameters.token,
        };

        const result = await collection.insertOne(savingData);

        return {
          statusCode: 200,
          body: JSON.stringify(returnOBJ),
        };
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({ errorMessage: err, uri: uri }),
        };
      } finally {
        await client.close();
      }
    } else {
      const database = client.db("BlitzWalletLNURLWithdrawl");
      const collection = database.collection("currentLNURL");

      try {
        const [userData] = await collection
          .find({ k1: Parameters.k1 })
          .toArray();
        await expo.sendPushNotificationsAsync([
          {
            to: `${userData.pushToken}`,
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
        await collection.deleteOne({
          k1: userData.k1,
        });
        return {
          statusCode: 200,
          body: JSON.stringify({ status: "ok" }),
        };
      } catch (err) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            errorMessage: "error with sending notification",
            te: err,
          }),
        };
        console.log(err);
      } finally {
        await client.close();
      }
    }
  }
}
