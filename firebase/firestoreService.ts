import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { firestore } from './config';
import { db } from '../db/db';
import { Goal, Deposit, Account } from '../types';

/**
 * Generic sync helper with robust error handling
 */
const syncCollectionToDexie = (uid: string, subPath: string, dexieTable: any) => {
  const colRef = collection(firestore, `users/${uid}/${subPath}`);
  
  return onSnapshot(
    colRef, 
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        if (change.type === 'added' || change.type === 'modified') {
          await dexieTable.put({ ...data, id });
        }
        if (change.type === 'removed') {
          await dexieTable.delete(id);
        }
      });
    },
    (error) => {
      console.error(`Firestore Sync Error [${subPath}]:`, error);
    }
  );
};

export const startRealtimeSync = (uid: string) => {
  const unsubGoals = syncCollectionToDexie(uid, 'goals', db.goals);
  const unsubDeposits = syncCollectionToDexie(uid, 'deposits', db.deposits);
  const unsubAccounts = syncCollectionToDexie(uid, 'accounts', db.accounts);

  return () => {
    unsubGoals();
    unsubDeposits();
    unsubAccounts();
  };
};

export const isFirestoreEmpty = async (uid: string) => {
  const goalsRef = collection(firestore, `users/${uid}/goals`);
  const snap = await getDocs(query(goalsRef, limit(1)));
  return snap.empty;
};

// --- CRUD OPERATIONS ---

// Goals
export const fsAddGoal = async (uid: string, goal: Goal) => {
  const docRef = doc(collection(firestore, `users/${uid}/goals`));
  const data = { 
    ...goal, 
    id: docRef.id, 
    emoji: goal.emoji || "🎯",
    isArchived: false,
    archivedAt: null,
    createdAt: new Date().toISOString(), 
    updatedAt: serverTimestamp() 
  };
  await setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateGoal = async (uid: string, goalId: string, updates: Partial<Goal>) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const fsArchiveGoal = async (uid: string, goalId: string) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  await updateDoc(docRef, { 
    isArchived: true, 
    archivedAt: new Date().toISOString(),
    updatedAt: serverTimestamp() 
  });
};

export const fsRestoreGoal = async (uid: string, goalId: string) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  await updateDoc(docRef, { 
    isArchived: false, 
    archivedAt: null,
    updatedAt: serverTimestamp() 
  });
};

export const fsDeleteGoal = async (uid: string, goalId: string) => {
  await deleteDoc(doc(firestore, `users/${uid}/goals/${goalId}`));
};

// Accounts
export const fsAddAccount = async (uid: string, account: Account) => {
  const docRef = doc(collection(firestore, `users/${uid}/accounts`));
  const data = { ...account, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: serverTimestamp() };
  await setDoc(docRef, data);
  return docRef.id;
};

export const fsDeleteAccount = async (uid: string, accountId: string) => {
  await deleteDoc(doc(firestore, `users/${uid}/accounts/${accountId}`));
};

// Deposits
export const fsAddDeposit = async (uid: string, deposit: Deposit) => {
  const docRef = doc(collection(firestore, `users/${uid}/deposits`));
  const data = { ...deposit, id: docRef.id, updatedAt: serverTimestamp() };
  await setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateDeposit = async (uid: string, depositId: string, updates: Partial<Deposit>) => {
  const docRef = doc(firestore, `users/${uid}/deposits/${depositId}`);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const fsDeleteDeposit = async (uid: string, depositId: string) => {
  await deleteDoc(doc(firestore, `users/${uid}/deposits/${depositId}`));
};
