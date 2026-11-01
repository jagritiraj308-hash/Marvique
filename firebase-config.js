import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getDatabase } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase Console se apna actual config paste karo
const firebaseConfig = {
  apiKey: "AIzaSyAOhe8NV1KbJq4eS70gtZS0UXC2xgMab6A",
  authDomain:   "marvique-8c867.firebaseapp.com",
  databaseURL:  "https://marvique-8c867-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId:  "marvique-8c867",
  storageBucket:   "marvique-8c867.firebasestorage.app",
  messagingSenderId:  "217389023047",
  appId:  "1:217389023047:web:464aebb8bd4d528c1c5662",
  measurementId: "G-YHP11DD886"
};

/*
  ADMIN ACCESS
  ------------
  Only these email addresses can open the admin panel and write products.
  Replace the placeholder with the email you created in
  Firebase Console -> Authentication -> Users.

  Keep this list in sync with database.rules.json.
*/
export const ADMIN_EMAILS = [
  "jagritiraj04@gmail.com"
];

export function isAdminEmail(email) {
  if (!email) return false;

  return ADMIN_EMAILS
    .map(function (item) { return item.toLowerCase(); })
    .includes(String(email).toLowerCase());
}

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getDatabase(app);
