"use strict";
import "dotenv/config";
import * as crypto from "crypto";

const algorithm = "aes-256-ctr";
const secretKey = process.env.ENCRIPTION_KEY;

const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      algorithm,
      "d04ec40718b0c037074fafff6fa0fa87be76ddf63b0aad750814e20234470575",
      iv
    );

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
      iv: iv.toString("hex"),
      content: encrypted.toString("hex"),
    };
  } catch (err) {
    return err;
  }
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, "hex")
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrpyted.toString();
};

export { encrypt, decrypt };
