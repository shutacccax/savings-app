
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
  limit,
  getDoc
} from 'firebase/firestore';
import { firestore } from './config';
import { db } from '../db/db';
import { Goal, Deposit, Account } from '../types';

const cleanObject = (obj: any) => {
  const clean: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
};

const syncCollectionToDexie = (uid: string, subPath: string, dexieTable: any) => {
  const colRef = collection(firestore, `users/${uid}/${subPath}`);
  
  return onSnapshot(
    colRef, 
    { includeMetadataChanges: true }, // Ensure local changes trigger UI instantly
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
      console.warn(`Firestore Sync Warning [${subPath}]:`, error);
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
  // Use a quick check
  const snap = await getDocs(query(goalsRef, limit(1)));
  return snap.empty;
};

/**
 * Permanently deletes all data for a user in Firestore and local Dexie cache.
 */
export const fsHardReset = async (uid: string) => {
  // 1. Delete Goals
  const goals = await db.goals.toArray();
  for (const g of goals) {
    if (g.id) await deleteDoc(doc(firestore, `users/${uid}/goals/${g.id}`));
  }
  // 2. Delete Deposits
  const deposits = await db.deposits.toArray();
  for (const d of deposits) {
    if (d.id) await deleteDoc(doc(firestore, `users/${uid}/deposits/${d.id}`));
  }
  // 3. Delete Accounts
  const accounts = await db.accounts.toArray();
  for (const a of accounts) {
    if (a.id) await deleteDoc(doc(firestore, `users/${uid}/accounts/${a.id}`));
  }
  
  // Clear local DB tables
  await db.goals.clear();
  await db.deposits.clear();
  await db.accounts.clear();
};

export const fsAddGoal = async (uid: string, goal: Goal) => {
  const docRef = doc(collection(firestore, `users/${uid}/goals`));
  const cleanedGoal = cleanObject(goal);
  const data = { 
    ...cleanedGoal, 
    id: docRef.id, 
    emoji: goal.emoji || "🎯",
    isArchived: false,
    archivedAt: null,
    createdAt: new Date().toISOString(), 
    updatedAt: serverTimestamp() 
  };
  // Do not await if we want instant UI (Firestore persistence handles it)
  setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateGoal = async (uid: string, goalId: string, updates: Partial<Goal>) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  updateDoc(docRef, { ...cleanObject(updates), updatedAt: serverTimestamp() });
};

export const fsArchiveGoal = async (uid: string, goalId: string) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  updateDoc(docRef, { 
    isArchived: true, 
    archivedAt: new Date().toISOString(),
    updatedAt: serverTimestamp() 
  });
};

export const fsRestoreGoal = async (uid: string, goalId: string) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  updateDoc(docRef, { 
    isArchived: false, 
    archivedAt: null,
    updatedAt: serverTimestamp() 
  });
};

export const fsDeleteGoal = async (uid: string, goalId: string) => {
  deleteDoc(doc(firestore, `users/${uid}/goals/${goalId}`));
};

export const fsAddAccount = async (uid: string, account: Account) => {
  const docRef = doc(collection(firestore, `users/${uid}/accounts`));
  const data = { ...cleanObject(account), id: docRef.id, createdAt: new Date().toISOString(), updatedAt: serverTimestamp() };
  setDoc(docRef, data);
  return docRef.id;
};

export const fsDeleteAccount = async (uid: string, accountId: string) => {
  deleteDoc(doc(firestore, `users/${uid}/accounts/${accountId}`));
};

export const fsAddDeposit = async (uid: string, deposit: Deposit) => {
  const docRef = doc(collection(firestore, `users/${uid}/deposits`));
  const data = { ...cleanObject(deposit), id: docRef.id, updatedAt: serverTimestamp() };
  
  // OPTIMISTIC LOOKUP: Use Dexie instead of getDoc (Firestore network call)
  const goalData = await db.goals.get(deposit.goalId);
  
  if (goalData && goalData.mode === 'challenge' && deposit.denominationValue && deposit.quantity) {
    const updatedDenominations = goalData.denominations?.map(d => {
      if (d.value === deposit.denominationValue) {
        return { ...d, currentQty: d.currentQty + (deposit.quantity || 0) };
      }
      return d;
    });
    
    const goalRef = doc(firestore, `users/${uid}/goals/${deposit.goalId}`);
    updateDoc(goalRef, { 
      denominations: updatedDenominations,
      updatedAt: serverTimestamp()
    });
  }

  setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateDeposit = async (uid: string, depositId: string, updates: Partial<Deposit>) => {
  // Use Dexie for the "old" data to avoid network getDoc
  const oldDeposit = await db.deposits.get(depositId);
  if (!oldDeposit) return;

  const goalData = await db.goals.get(oldDeposit.goalId);
  if (goalData && goalData.mode === 'challenge') {
    let updatedDenominations = [...(goalData.denominations || [])];

    // Undo old
    if (oldDeposit.denominationValue && oldDeposit.quantity) {
      updatedDenominations = updatedDenominations.map(d => 
        d.value === oldDeposit.denominationValue 
          ? { ...d, currentQty: Math.max(0, d.currentQty - oldDeposit.quantity!) } 
          : d
      );
    }

    // Apply new
    const newDenom = updates.denominationValue || oldDeposit.denominationValue;
    const newQty = updates.quantity !== undefined ? updates.quantity : oldDeposit.quantity;
    
    if (newDenom && newQty) {
      updatedDenominations = updatedDenominations.map(d => 
        d.value === newDenom 
          ? { ...d, currentQty: d.currentQty + newQty } 
          : d
      );
    }

    const goalRef = doc(firestore, `users/${uid}/goals/${oldDeposit.goalId}`);
    updateDoc(goalRef, { 
      denominations: updatedDenominations,
      updatedAt: serverTimestamp()
    });
  }

  const depositRef = doc(firestore, `users/${uid}/deposits/${depositId}`);
  updateDoc(depositRef, { ...cleanObject(updates), updatedAt: serverTimestamp() });
};

export const fsDeleteDeposit = async (uid: string, depositId: string) => {
  const deposit = await db.deposits.get(depositId);
  if (!deposit) return;

  const goalData = await db.goals.get(deposit.goalId);
  if (goalData && goalData.mode === 'challenge' && deposit.denominationValue && deposit.quantity) {
    const updatedDenominations = goalData.denominations?.map(d => {
      if (d.value === deposit.denominationValue) {
        return { ...d, currentQty: Math.max(0, d.currentQty - deposit.quantity!) };
      }
      return d;
    });
    
    const goalRef = doc(firestore, `users/${uid}/goals/${deposit.goalId}`);
    updateDoc(goalRef, { 
      denominations: updatedDenominations,
      updatedAt: serverTimestamp()
    });
  }

  const depositRef = doc(firestore, `users/${uid}/deposits/${depositId}`);
  deleteDoc(depositRef);
};
