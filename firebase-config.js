
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Firebase Console se apna actual config paste karo
const firebaseConfig = {
  apiKey: "AIzaSyAOhe8NV1KbJq4eS70gtZS0UXC2xgMab6A",
  authDomain:   "marvique-8c867.firebaseapp.com",
  projectId:  "marvique-8c867",
  storageBucket:   "marvique-8c867.firebasestorage.app",
  messagingSenderId:  "217389023047",
  appId:  "1:217389023047:web:464aebb8bd4d528c1c5662",
  measurementId: "G-YHP11DD886"
};

 const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);