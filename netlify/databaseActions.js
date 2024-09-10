"use strict";
import "dotenv/config";
import { signIn } from "../db";
import { decrypt } from "../middleware/encription";
import { decryptMessage } from "../middleware/newEncription";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const postData = event.body ? JSON.parse(event.body) : null; //sanitation
    const decryptedContent = await decryptMessage(
      process.env.DB_PRIVKEY,
      postData.pubKey,
      postData.content
    );
    const databaseMethod = decryptedContent.type.toLowerCase();

    if (databaseMethod === "adddata") {
      //Add data to database and return if succesful or not
    } else if (databaseMethod == "getdata") {
      //get and return data to device
    } else if (databaseMethod === "deletedata") {
      //delete data from database and return if successful or not
    } else if (databaseMethod === "validuniquename") {
      //check if is valid and return value
    } else if (databaseMethod === "singlecontact") {
      //gets single contact and returns contact
    } else if (databaseMethod === "validposname") {
      //check if is valid and return value
    } else if (databaseMethod === "searchusers") {
      //returns a list of users based on search parameter
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "ERROR",
          reason: "Not a valid DB method",
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
