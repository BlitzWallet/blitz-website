import * as admin from "firebase-admin";
import { initializeAuth, signInWithCustomToken } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: "blitz-wallet-82b39.firebaseapp.com",
  projectId: "blitz-wallet-82b39",
  storageBucket: "blitz-wallet-82b39.appspot.com",
  messagingSenderId: "129198472150",
  appId: "1:129198472150:web:86511e5250364ee1764277",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig, "blitzWallet");
} else {
  app = getApps()[0]; // use the already initialized app
}

const db = getFirestore(app);
const auth = initializeAuth(app);

export async function addDataToCollection(
  dataObject,
  collectionName = "blitzWalletUsers",
  uuid
) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const docRef = doc(db, `${collectionName}/${uuid}`);

    let docData = dataObject;

    docData["uuid"] = uuid;

    setDoc(docRef, docData, { merge: true });

    console.log("Document written with ID: ", docData);

    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    return false;
  }
}
export async function getDataFromCollection(
  collectionName = "blitzWalletUsers",
  uuid
) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const docRef = doc(db, `${collectionName}`, `${uuid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      return data;
    } else return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}
export async function deleteDataFromCollection(
  collectionName = "blitzWalletUsers",
  uuid
) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const docRef = doc(db, `${collectionName}/${uuid}`);
    const respones = await deleteDoc(docRef);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function isValidUniqueName(
  collectionName = "blitzWalletUsers",
  wantedName
) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const userProfilesRef = collection(db, collectionName);
    const q = query(
      userProfilesRef,
      where(
        "contacts.myProfile.uniqueNameLower",
        "==",
        wantedName.toLowerCase()
      )
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function queryContacts(collectionName) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const snapshot = await getDocs(collection(db, collectionName));

    return snapshot["docs"];
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getSignleContact(
  collectionName = "blitzWalletUsers",
  wantedName
) {
  console.log(collectionName, wantedName);
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const userProfilesRef = collection(db, collectionName);

    const q = query(
      userProfilesRef,
      where("contacts.myProfile.uniqueNameLower", "==", wantedName)
    );

    const querySnapshot = await getDocs(q);
    // Extract the data from each document
    const userData = querySnapshot.docs.map((doc) => doc.data());
    return userData;
  } catch (err) {
    console.log(err);
    return false;
  }
}
export async function canUsePOSName(
  collectionName = "blitzWalletUsers",
  wantedName
) {
  try {
    const didSignIn = await signIn();
    if (!didSignIn) throw Error("Not signed in");
    const userProfilesRef = collection(db, collectionName);
    const q = query(
      userProfilesRef,
      where("posSettings.storeNameLower", "==", wantedName.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (err) {
    console.log(err);
    return false;
  }
}

// Function to search users by username
export async function searchUsers(
  collectionName = "blitzWalletUsers",
  searchTerm
) {
  const didSignIn = await signIn();
  if (!didSignIn) throw Error("Not signed in");
  if (!searchTerm) return []; // Return an empty array if the search term is empty

  try {
    const usersRef = collection(db, collectionName);
    const q = query(
      usersRef,
      where(
        "contacts.myProfile.uniqueNameLower",
        ">=",
        searchTerm.toLowerCase()
      ),
      where(
        "contacts.myProfile.uniqueNameLower",
        "<=",
        searchTerm.toLowerCase() + "\uf8ff"
      )
    );
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => {
      return doc.data()?.contacts?.myProfile;
    });
    return users;
  } catch (error) {
    console.error("Error searching users: ", error);
    return false; //needd to equal empty arrray
  }
}

export async function signIn() {
  try {
    const token = await admin
      .auth()
      .createCustomToken(process.env.FIREBASE_AUTH_CODE);
    await signInWithCustomToken(auth, token);
    if (!token) throw Error("NO CLAIM TOKEN CREATED");
    return token;
  } catch (error) {
    console.error("Error signing in anonymously", error);
    return false;
  }
}
