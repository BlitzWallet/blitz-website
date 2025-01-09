"use strict";
import { initializeFirebase } from "../db";

export async function verifyAppCheckToken(token) {
  try {
    const { admin } = await initializeFirebase();

    await admin.appCheck().verifyToken(token);
    console.log("DID VERIFY");
    return true;
  } catch (err) {
    throw new Error(String(err));
  }
}
