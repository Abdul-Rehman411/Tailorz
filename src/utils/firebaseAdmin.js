// utils/firebaseAdmin.js
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json"; // Make sure this file exists and is in .gitignore

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
