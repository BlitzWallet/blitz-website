"use strict";
import "dotenv/config";
import { ECPairFactory } from "ecpair";
import { Transaction, address, crypto, networks } from "liquidjs-lib";
import { randomBytes } from "liquidjs-lib/src/psetv2/utils";
import ecc from "@bitcoinerlab/secp256k1";

export async function createLNtoLiquidSwap(
  invoiceAmount,
  liquidAddress,
  uniqueName
) {
  console.log("RUNNING IN FUNC");
  // Create a random preimage for the swap; has to have a length of 32 bytes

  try {
    const preimage = randomBytes(32);
    const keys = ECPairFactory(ecc).makeRandom({ network: networks.liquid });

    const signature = keys.signSchnorr(
      crypto.sha256(Buffer.from(liquidAddress, "utf-8"))
    );

    console.log(liquidAddress);
    // Create a Submarine Swap
    const createdResponse = await (
      await fetch(`${process.env.BOLTZ_API_URL}swap/reverse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: liquidAddress,
          addressSignature: signature.toString("hex"),
          invoiceAmount: Number(invoiceAmount),
          to: "L-BTC",
          from: "BTC",
          claimPublicKey: keys.publicKey.toString("hex"),
          preimageHash: crypto.sha256(preimage).toString("hex"),
          referralId: "blitzWallet",
          description: `Pay to ${uniqueName}`,
        }),
      })
    ).json();

    return { createdResponse, keys, preimage };
  } catch (err) {
    return false;
  }
}
