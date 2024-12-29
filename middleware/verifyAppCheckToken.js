import { initializeFirebase } from "../db";

export default async function verifyAppCheckToken(token) {
  try {
    const { admin } = await initializeFirebase();

    await admin.appCheck().verifyToken(token);
    return true;
  } catch (err) {
    throw new Error("Not valid app check token");
  }
}
