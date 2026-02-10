
// Consolidated functional imports from firebase/auth for modular usage
// Using module access to bypass missing named exports in the environment
import * as authLib from 'firebase/auth';
import { auth } from './config';

// Authentication utility functions using Firebase modular SDK accessed via any-cast
export const register = (email: string, pass: string) => 
  (authLib as any).createUserWithEmailAndPassword(auth, email, pass);

export const login = (email: string, pass: string) => 
  (authLib as any).signInWithEmailAndPassword(auth, email, pass);

export const logout = () => (authLib as any).signOut(auth);

// Use any for user type to bypass missing User export in the environment
export const subscribeToAuthChanges = (callback: (user: any | null) => void) => 
  (authLib as any).onAuthStateChanged(auth, callback);
