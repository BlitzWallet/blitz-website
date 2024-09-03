import {
  TaprootUtils,
  constructClaimTransaction,
  init,
} from "boltz-core/dist/lib/liquid";
import { Buffer } from "buffer";
import { randomBytes } from "crypto";
import { Transaction, address as addressLib } from "liquidjs-lib";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  detectSwap,
  targetFee,
} from "boltz-core";
import { getSwapStatus } from "./getSwapStatus";
export default async function claimBoltzTransaction(
  keys,
  createdResponse = {
    id: "tJFF1694ueaJ",
    invoice:
      "lntb24u1pndw7unsp5au72nwa329z07wjup49qjx0jr8j6vvzzjmm3lx645plk437n9qaqpp5ekpasurt37vt4lcw0v35eetfm352jmnzpa7dnd05cwxe7gp56gesdpz2djkuepqw3hjqnpdgf2yxgrpv3j8yetnwvxqyp2xqcqz95rzjq03t20ar9p2736rkwme9zpxyql7ttuxzemd4j4g6m2j0uez4rduzszzxeyqq28qqqqqqqqqqqqqqq9gq2y9qyysgqu7hp2p2a9z34t43yla9f499a9txjlvze5s7kw99p4mz2fg04qj8ryed05fqyycq9mewpuvf9jz8989qml4pze4csuy37tmqch5xda2qpqwaa5k",
    swapTree: {
      claimLeaf: {
        version: 196,
        output:
          "82012088a914e60b0dd285a064fe15813cdff5fecd5481babe088820e2b53fa32855e8e87676f25104c407fcb5f0c2cedb59551adaa4fe64551b7828ac",
      },
      refundLeaf: {
        version: 196,
        output:
          "20d35bd21acb1b0c3536abd4e345fd796a1415e9a3589408e85e52720c21a66ef3ad03f3b917b1",
      },
    },
    blindingKey:
      "8bdd214af4c8cbf0680b2054c3ec5dd24451e204f2723e5763fc8d34840cfa98",
    lockupAddress:
      "tlq1pqwqf34jnaqszrmu6536v4kk9zpkhdeqytk9ah89qv9mvlpdpany3zqh95c3tp3d3qcknng43pa5n2sffggxzmnneg38lvt099q8wnv9lwpchw5w7gezd",
    refundPublicKey:
      "02d35bd21acb1b0c3536abd4e345fd796a1415e9a3589408e85e52720c21a66ef3",
    timeoutBlockHeight: 1554931,
    onchainAmount: 2118,
  },
  preimage,
  network,
  feeRate = 0.11
) {
  console.log(keys, createdResponse, preimage, network, feeRate);
  try {
    // init(await zkpInit());

    console.log("Creating claim transaction");
    const swapStatus = await getSwapStatus(
      createdResponse.id,
      process.env.BOLTZ_API_URL
    );
    console.log(swapStatus);
    if (!swapStatus.transaction?.hex) throw Error("LOCK_TRANSACTION_MISSING");

    console.log("GOT PASSED SWAP STATSU");

    const boltzPublicKey = Buffer.from(createdResponse.refundPublicKey, "hex");

    // Create a musig signing session and tweak it with the Taptree of the swap scripts
    const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
      boltzPublicKey,
      keys.publicKey,
    ]);
    const tweakedKey = TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree
    );

    // Parse the lockup transaction and find the output relevant for the swap
    const lockupTx = Transaction.fromHex(swapStatus.transaction.hex);
    const swapOutput = detectSwap(tweakedKey, lockupTx);
    if (swapOutput === undefined) {
      console.error("No swap output found in lockup transaction");
      return;
    }

    // Create a claim transaction to be signed cooperatively via a key path spend
    const claimTx = targetFee(feeRate, (fee) =>
      constructClaimTransaction(
        [
          {
            ...swapOutput,
            keys,
            preimage,
            cooperative: true,
            type: OutputType.Taproot,
            txHash: lockupTx.getHash(),
            blindingPrivateKey: Buffer.from(createdResponse.blindingKey, "hex"),
          },
        ],
        address.toOutputScript(destinationAddress, network),
        fee,
        false,
        network,
        address.fromConfidential(destinationAddress).blindingKey
      )
    );

    // Get the partial signature from Boltz
    const boltzSigResponse = await fetch(
      `${process.env.BOLTZ_API_URL}v2/swap/reverse/${createdResponse.id}/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          index: 0,
          transaction: claimTx.toHex(),
          preimage: preimage.toString("hex"),
          pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
        }),
      }
    );

    const boltzSig = await boltzSigResponse.json();

    // Aggregate the nonces
    musig.aggregateNonces([
      [boltzPublicKey, Buffer.from(boltzSig.pubNonce, "hex")],
    ]);

    // Initialize the session to sign the claim transaction
    musig.initializeSession(
      claimTx.hashForWitnessV1(
        0,
        [swapOutput.script],
        [{ value: swapOutput.value, asset: swapOutput.asset }],
        Transaction.SIGHASH_DEFAULT,
        network.genesisBlockHash
      )
    );

    // Add the partial signature from Boltz
    musig.addPartial(
      boltzPublicKey,
      Buffer.from(boltzSig.partialSignature, "hex")
    );

    // Create our partial signature
    musig.signPartial();

    // Witness of the input to the aggregated signature
    claimTx.ins[0].witness = [musig.aggregatePartials()];

    // Broadcast the finalized transaction
    await fetch(`${process.env.BOLTZ_API_URL}v2/chain/L-BTC/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hex: claimTx.toHex(),
      }),
    });
  } catch (err) {
    console.log(err, "BOLTZ CLAIM ERROR");
  }
}
