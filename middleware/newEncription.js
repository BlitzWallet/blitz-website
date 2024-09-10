import { Buffer } from "buffer";
import * as secp from "@noble/secp256k1";

// Encoding and decoding base64 using the web standard functions
const btoa = (str) => Buffer.from(str, "binary").toString("base64");
const atob = (b64) => Buffer.from(b64, "base64").toString("binary");

// Encrypt message using AES-256-CBC and secp256k1 shared secret
async function encryptMessage(privkey, pubkey, text) {
  try {
    // Get the shared secret
    const sharedPoint = secp.getSharedSecret(privkey, "02" + pubkey);
    const sharedX = sharedPoint.slice(1, 33); // Take X coordinate

    // Generate an IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Encode the text as a UTF-8 buffer
    const encoder = new TextEncoder();
    const textBuffer = encoder.encode(text);

    // Import the encryption key using the shared secret
    const key = await crypto.subtle.importKey(
      "raw",
      sharedX,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    // Encrypt the message using AES-256-CBC
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: iv },
      key,
      textBuffer
    );

    // Convert encrypted data and IV to base64
    const encryptedMessage = Buffer.from(encryptedBuffer).toString("base64");
    const ivBase64 = btoa(String.fromCharCode.apply(null, iv));

    // Return the encrypted message with the IV attached
    return encryptedMessage + "?iv=" + ivBase64;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Decrypt message using AES-256-CBC and secp256k1 shared secret
async function decryptMessage(privkey, pubkey, encryptedText) {
  try {
    // Get the shared secret
    const sharedPoint = secp.getSharedSecret(privkey, "02" + pubkey);
    const sharedX = sharedPoint.slice(1, 33); // Take X coordinate

    // Extract the IV from the encrypted message
    const ivStr = encryptedText.split("?iv=")[1];
    const iv = new Uint8Array(
      atob(ivStr)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Remove the IV part from the encrypted message
    const encryptedData = encryptedText.split("?iv=")[0];

    // Convert the base64-encoded encrypted message to a buffer
    const encryptedBuffer = Buffer.from(encryptedData, "base64");

    // Import the decryption key using the shared secret
    const key = await crypto.subtle.importKey(
      "raw",
      sharedX,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    // Decrypt the message using AES-256-CBC
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv },
      key,
      encryptedBuffer
    );

    // Decode the decrypted message as UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export { encryptMessage, decryptMessage };
