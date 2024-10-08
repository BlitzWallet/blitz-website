"use strict";
import "dotenv/config";
// import {
//   addDataToCollection,
//   // deleteDataFromCollection,
//   getDataFromCollection,
// } from "../db";
import { MongoClient, ServerApiVersion } from "mongodb";
const uri = `mongodb+srv://blitzwallet:${process.env.MONGO_PASS}@blitzorgdata.g6tvz.mongodb.net/?retryWrites=true&w=majority&appName=BlitzOrgData`;
import * as admin from "firebase-admin";
import { decrypt, encrypt } from "./encription";
import {
  getCurrentDateFormatted,
  isMoreThan21Days,
  isMoreThan40MinOld,
} from "./rotateTBCtokens";
import { initializeFirebase, signIn } from "../db";

// const client = new MongoClient(uri);
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
export async function getFireabaseAcessToken() {
  try {
    await client.connect();
    const database = client.db("BlitzWallet");
    const collection = database.collection("BlitzOrgData");
    const [orgData] = await collection.find({ id: "firebaseToken" }).toArray();

    console.log(orgData);

    const decryptedContent = orgData
      ? JSON.parse(decrypt(orgData.content))
      : false;

    if (
      !orgData ||
      isMoreThan40MinOld(decryptedContent?.lastRotatedAccessToken)
    ) {
      const { db, auth, app } = await initializeFirebase();

      const token = await admin
        .auth()
        .createCustomToken(process.env.FIREBASE_AUTH_CODE, { role: "admin" });

      const encripted = encrypt(
        JSON.stringify({
          lastRotatedAccessToken: new Date(),
          accessToken: token,
        })
      );

      if (orgData) {
        const result = await collection.replaceOne(
          { id: "firebaseToken" },
          {
            content: encripted,
            id: "firebaseToken",
          }
        );
      } else {
        const result = await collection.insertOne({
          content: encripted,
          id: "firebaseToken",
        });
      }

      return token;
    } else {
      return decryptedContent.accessToken;
    }
  } catch (err) {
    return false;
  } finally {
    console.log("RUNNIN IN CLOSE");
    await client.close();
  }
}
