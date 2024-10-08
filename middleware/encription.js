"use strict";
import "dotenv/config";
import * as crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = Buffer.from(process.env.ENCRIPTION_KEY, "hex");

const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString("hex"),
      content: encrypted.toString("hex"),
    };
  } catch (err) {
    return false;
  }
};

const decrypt = (hash) => {
  try {
    // Extract the IV and content from the hash
    const iv = Buffer.from(hash.iv, "hex"); // Convert IV back to Buffer
    const encryptedText = Buffer.from(hash.content, "hex"); // Convert encrypted content back to Buffer

    // Create decipher object with the same algorithm, secret key, and IV
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    // Decrypt the content
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    // Return the decrypted text
    const key = decrypted.toString();
    return key;
  } catch (err) {
    return false;
  }
};

export { encrypt, decrypt };
