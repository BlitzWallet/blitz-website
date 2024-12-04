"use strict";
import "dotenv/config";

import jwt from "jsonwebtoken";
import { decryptMessage } from "../middleware/newEncription";
import { getDataFromCollection } from "../db";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation

    try {
      const { appPubKey, checkContent, id } = data;
      if (!appPubKey && !checkContent && id) {
        const token = jwt.sign({ id: id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "2h",
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ token: token }),
        };
      }

      const userData = await getDataFromCollection(undefined, appPubKey);
      const savedCheckValue = await JSON.parse(
        await decryptMessage(
          process.env.BACKEND_PRIV_KEY,
          appPubKey,
          userData.jwtCheckValue
        )
      );
      const decryptedContent = JSON.parse(
        await decryptMessage(
          process.env.BACKEND_PRIV_KEY,
          appPubKey,
          checkContent
        )
      );

      if (decryptedContent.databaseCopy) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Invalid content provided" }),
        };
      }
      if (decryptedContent.checkHash !== savedCheckValue.checkHash) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Invalid hash provided" }),
        };
      }

      const token = jwt.sign(
        { checkHash: decryptedContent.checkHash },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ token: token }),
      };
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Error creating token" }),
      };
    } // // JSON WEB TOKEN
  } else
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Must be a post request" }),
    };
}
