
import { initializeApp } from 'firebase/app';
// Fix: Use property access to bypass missing named export in the environment
import * as authLib from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR4o_LwD_aHYwxs_ImBJCM6qnnfGaMUow",
  authDomain: "savr-1288c.firebaseapp.com",
  projectId: "savr-1288c",
  storageBucket: "savr-1288c.firebasestorage.app",
  messagingSenderId: "537971810018",
  appId: "1:537971810018:web:c319df344e0ee24bf4c8bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Cast the library to any to resolve the missing member error during compilation
export const auth: any = (authLib as any).getAuth(app);
export const firestore = getFirestore(app);
