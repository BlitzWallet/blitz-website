"use strict";
import "dotenv/config";
// import {
//   addDataToCollection,
//   // deleteDataFromCollection,
//   getDataFromCollection,
// } from "../db";
import { MongoClient, ServerApiVersion } from "mongodb";
const uri = `mongodb+srv://blitzwallet:${process.env.MONGO_PASS}@blitzorgdata.g6tvz.mongodb.net/?retryWrites=true&w=majority&appName=BlitzOrgData`;

import { decrypt, encrypt } from "./encription";
import {
  getCurrentDateFormatted,
  isMoreThan21Days,
  isMoreThan40MinOld,
} from "./rotateTBCtokens";

const serverURL =
  process.env.ENVIRONMENT === "liquid"
    ? "https://api.thebitcoincompany.com"
    : "https://api.dev.thebitcoincompany.com";

// const client = new MongoClient(uri);
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
export async function getTBCaccessCode() {
  try {
    await client.connect();
    const database = client.db("BlitzWallet");
    const collection = database.collection("BlitzOrgData");
    const [orgData] = await collection
      .find({ id: process.env.BLITZ_ORG_DB_REF })
      .toArray();

    const decryptedContent = orgData
      ? JSON.parse(decrypt(orgData.content))
      : false;

    if (
      !orgData ||
      isMoreThan40MinOld(decryptedContent?.lastRotatedAccessToken) ||
      isMoreThan21Days(decryptedContent?.lastRotatedrefreshToken)
    ) {
      const response = await fetch(`${serverURL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({
          email: process.env.THE_BITCOIN_COMPANY_EMAIL,
          password: process.env.THE_BITCION_COMPANY_PASS,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.statusCode === 400) return false;

      const encripted = encrypt(
        JSON.stringify({
          lastRotatedAccessToken: new Date(),
          accessToken: data.result.accessToken,
          refreshToken: data.result.refreshToken,
          lastRotatedrefreshToken: new Date(),
        })
      );

      if (orgData) {
        const result = await collection.replaceOne(
          { id: process.env.BLITZ_ORG_DB_REF },
          {
            content: encripted,
            id: process.env.BLITZ_ORG_DB_REF,
          }
        );
      } else {
        const result = await collection.insertOne({
          content: encripted,
          id: process.env.BLITZ_ORG_DB_REF,
        });
      }

      return data.result.accessToken;
    } else {
      return decryptedContent.accessToken;
    }
  } catch (err) {
    console.log(err);
    return false;
  } finally {
    console.log("RUNNIN IN CLOSE");
    await client.close();
  }
}
