"use strict";
import "dotenv/config";
import {
  addDataToCollection,
  deleteDataFromCollection,
  getDataFromCollection,
  isValidUniqueName,
  queryContacts,
} from "../db";
import { decryptMessage, encryptMessage } from "../middleware/newEncription";

export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    const postData = event.body ? JSON.parse(event.body) : null; //sanitation
    const decryptedContent = await decryptMessage(
      process.env.DB_PRIVKEY,
      postData.pubKey,
      postData.content
    );
    const databaseMethod = decryptedContent.type.toLowerCase();
    const userPubKey = postData.pubKey;
    const collectionName = decryptedContent.collectionName;

    try {
      if (databaseMethod === "adddata") {
        const didAddData = await addDataToCollection(
          decryptedContent.dataObject,
          collectionName,
          userPubKey
        );
        if (didAddData) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: "SUCCESS",
            }),
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Not able to add data to database",
            }),
          };
        }
      } else if (databaseMethod == "getdata") {
        const returnedContact = await getDataFromCollection(
          collectionName,
          userPubKey
        );
        if (returnedContact) {
          const encriptedContact = encryptMessage(
            process.env.DB_PRIVKEY,
            userPubKey,
            JSON.stringify(returnedContact)
          );
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: "SUCCESS",
              data: encriptedContact,
            }),
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Not able to get contact",
            }),
          };
        }

        //get and return data to device
      } else if (databaseMethod === "deletedata") {
        const didDeleteData = await deleteDataFromCollection(
          decryptedContent.dataObject,
          userPubKey
        );
        if (didDeleteData) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: "SUCCESS",
            }),
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Not able to delete data from database",
            }),
          };
        }
        //delete data from database and return if successful or not
      } else if (databaseMethod === "validuniquename") {
        const isNameAvailable = await isValidUniqueName(
          decryptedContent.dataObject,
          decryptedContent.wantedName
        );
        if (isNameAvailable) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: "SUCCESS",
            }),
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Name not available",
            }),
          };
        }
        //check if is valid and return value
      } else if (databaseMethod === "getallcontacts") {
        const returnedContacts = await queryContacts(collectionName);
        if (returnedContacts) {
          const encriptedContacts = encryptMessage(
            process.env.DB_PRIVKEY,
            userPubKey,
            JSON.stringify(returnedContacts)
          );
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: "SUCCESS",
              data: encriptedContacts,
            }),
          };
        } else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              status: "ERROR",
              reason: "Not able to get contact",
            }),
          };
        }
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
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "ERROR",
          reason: "Calling database method failed",
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
