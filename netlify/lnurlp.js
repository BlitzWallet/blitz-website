"use strict";
import "dotenv/config";
import { getSignleContact } from "../db";
import { createBoltzSwapKeys } from "../middleware/createBoltzSwapKeys";
import { randomBytes } from "liquidjs-lib/src/psetv2/utils";
import createLNtoLiquidSwap from "../middleware/createLNtoLiquidSwap";
import claimBoltzTransaction from "../middleware/claimBoltzSwap";

export async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const data = event.body ? JSON.parse(event.body) : null; //sanitation
    try {
      const pathParts = event.path.split("/");
      const username = pathParts[pathParts.length - 1];
      const queryParams = event.queryStringParameters;

      if (Object.keys(queryParams).length === 0) {
        const swapRates = await (
          await fetch(`${process.env.BOLTZ_API_URL}swap/reverse`)
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
        console.log("TEST");
        const [payingContact] = await getSignleContact(username.toLowerCase());
        console.log(queryParams);
        const receiveAddress =
          payingContact["contacts"].myProfile.receiveAddress;
        const receiveAmount = queryParams.amount;
        // console.log(receiveAmount);

        const createdResponse = await createLNtoLiquidSwap(
          receiveAmount,
          receiveAddress
        );

        console.log(createdResponse.createdResponse);

        setTimeout(() => {
          claimBoltzTransaction(
            createdResponse.keys,
            undefined,
            createdResponse.preimage,
            process.env.ENVIRONMENT,
            0.11
          );
        }, 15000);
        // console.log(createdResponse);
        return {
          statusCode: 200,
          body: JSON.stringify(`yes`),
        };
        const preimage = crypto.randomBytes(32);

        const preimageHash = sha256(preimage).toString("hex");

        const liquidAddress = await createLiquidReceiveAddress();
        const signature = keys.signSchnorr(
          sha256(Buffer.from(liquidAddress.address, "utf-8"))
        );

        console.log(liquidAddress.address);

        const data = (
          await axios.post(
            `${getBoltzApiUrl(process.env.BOLTZ_ENVIRONMENT)}/v2/swap/reverse`,
            {
              address: liquidAddress.address,
              addressSignature: signature.toString("hex"),
              claimPublicKey: keys.publicKey.toString("hex"),
              from: "BTC",
              invoiceAmount: swapAmountSats,
              preimageHash: preimageHash,
              to: "L-BTC",
              referralId: "blitzWallet",
              description: description || "Send to Blitz Wallet",
            }
          )
        ).data;

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