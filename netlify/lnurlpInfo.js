"use strict";
import "dotenv/config";
import { getSignleContact } from "../db";

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation
    try {
      const pathParts = event.path.split("/");
      const username = pathParts[pathParts.length - 1];
      const queryParams = event.queryStringParameters;

      if (Object.keys(queryParams).length === 0) {
        const swapRates = await (
          await fetch("https://api.boltz.exchange/v2/swap/reverse")
        ).json();
        const limits = swapRates["BTC"]["L-BTC"].limits;
        return {
          statusCode: 200,
          body: JSON.stringify({
            callback: `https://blitz-wallet.com/.netlify/functoins/lnurlpAddress/${username}`, // The URL from LN SERVICE which will accept the pay request parameters
            maxSendable: limits.maximal * 1000, // Max millisatoshi amount LN SERVICE is willing to receive
            minSendable: limits.minimal * 1000, // Min millisatoshi amount LN SERVICE is willing to receive, can not be less than 1 or more than `maxSendable`
            metadata: JSON.stringify([
              [
                "text/plain", // mandatory,
                `Pay to ${username}`, // short description displayed when paying and in transaction log
              ],
            ]), //
            tag: "payRequest", // Type of LNURL
          }),
        };
      } else {
        const [payingContact] = await getSignleContact(username.toLowerCase());
        console.log(queryParams);
        const receiveAddress =
          payingContact["contacts"].myProfile.receiveAddress;
        const receiveAmount = queryParams.amount;
        console.log(receiveAmount);

        return {
          statusCode: 200,
          body: JSON.stringify(`${receiveAddress} ${receiveAmount}`),
        };
      }
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Error creating lnurlp request",
          err: JSON.stringify(err),
        }),
      };
    } // // JSON WEB TOKEN
  } else
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Must be a get request" }),
    };
}
