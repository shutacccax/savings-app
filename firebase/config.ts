
// Fix: Importing firebase/app as a namespace to bypass issues with named exports in this environment
import * as firebaseApp from "firebase/app";
import * as authLib from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDR4o_LwD_aHYwxs_ImBJCM6qnnfGaMUow",
  authDomain: "savr-1288c.firebaseapp.com",
  projectId: "savr-1288c",
  storageBucket: "savr-1288c.firebasestorage.app",
  messagingSenderId: "537971810018",
  appId: "1:537971810018:web:c319df344e0ee24bf4c8bb"
};

// Fix: Accessing initializeApp via namespace with any-cast to resolve "no exported member" error
const app = (firebaseApp as any).initializeApp(firebaseConfig);

// Auth
export const auth: any = (authLib as any).getAuth(app);

// Firestore
export const firestore = getFirestore(app);

// 🔥 Enable offline persistence
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open. Offline persistence disabled.");
  } else if (err.code === "unimplemented") {
    console.warn("This browser does not support offline persistence.");
  }
});
