import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBFLihwSkSkDMj1wnil4tYg3tTiKKsMdhk",
  authDomain: "gp-textiles.firebaseapp.com",
  projectId: "gp-textiles",
  storageBucket: "gp-textiles.firebasestorage.app",
  messagingSenderId: "565581833068",
  appId: "1:565581833068:web:d78180f186cf616d05c949",
};

const firebaseApp = initializeApp(firebaseConfig);

export const messaging = getMessaging(firebaseApp);
