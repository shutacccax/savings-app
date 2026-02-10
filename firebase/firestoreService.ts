
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

/**
 * Utility to remove undefined properties from an object for Firestore compatibility.
 */
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
  await setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateGoal = async (uid: string, goalId: string, updates: Partial<Goal>) => {
  const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
  await updateDoc(docRef, { ...cleanObject(updates), updatedAt: serverTimestamp() });
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

export const fsAddAccount = async (uid: string, account: Account) => {
  const docRef = doc(collection(firestore, `users/${uid}/accounts`));
  const data = { ...cleanObject(account), id: docRef.id, createdAt: new Date().toISOString(), updatedAt: serverTimestamp() };
  await setDoc(docRef, data);
  return docRef.id;
};

export const fsDeleteAccount = async (uid: string, accountId: string) => {
  await deleteDoc(doc(firestore, `users/${uid}/accounts/${accountId}`));
};

export const fsAddDeposit = async (uid: string, deposit: Deposit) => {
  const docRef = doc(collection(firestore, `users/${uid}/deposits`));
  const data = { ...cleanObject(deposit), id: docRef.id, updatedAt: serverTimestamp() };
  
  const goalRef = doc(firestore, `users/${uid}/goals/${deposit.goalId}`);
  const goalSnap = await getDoc(goalRef);
  
  if (goalSnap.exists()) {
    const goalData = goalSnap.data() as Goal;
    if (goalData.mode === 'challenge' && deposit.denominationValue && deposit.quantity) {
      const updatedDenominations = goalData.denominations?.map(d => {
        if (d.value === deposit.denominationValue) {
          return { ...d, currentQty: d.currentQty + (deposit.quantity || 0) };
        }
        return d;
      });
      await updateDoc(goalRef, { 
        denominations: updatedDenominations,
        updatedAt: serverTimestamp()
      });
    }
  }

  await setDoc(docRef, data);
  return docRef.id;
};

export const fsUpdateDeposit = async (uid: string, depositId: string, updates: Partial<Deposit>) => {
  const depositRef = doc(firestore, `users/${uid}/deposits/${depositId}`);
  const depositSnap = await getDoc(depositRef);
  if (!depositSnap.exists()) return;
  const oldDeposit = depositSnap.data() as Deposit;

  const goalRef = doc(firestore, `users/${uid}/goals/${oldDeposit.goalId}`);
  const goalSnap = await getDoc(goalRef);
  
  if (goalSnap.exists()) {
    const goalData = goalSnap.data() as Goal;
    
    if (goalData.mode === 'challenge') {
      let updatedDenominations = [...(goalData.denominations || [])];

      if (oldDeposit.denominationValue && oldDeposit.quantity) {
        updatedDenominations = updatedDenominations.map(d => 
          d.value === oldDeposit.denominationValue 
            ? { ...d, currentQty: Math.max(0, d.currentQty - oldDeposit.quantity!) } 
            : d
        );
      }

      const newDenom = updates.denominationValue || oldDeposit.denominationValue;
      const newQty = updates.quantity !== undefined ? updates.quantity : oldDeposit.quantity;
      
      if (newDenom && newQty) {
        updatedDenominations = updatedDenominations.map(d => 
          d.value === newDenom 
            ? { ...d, currentQty: d.currentQty + newQty } 
            : d
        );
      }

      await updateDoc(goalRef, { 
        denominations: updatedDenominations,
        updatedAt: serverTimestamp()
      });
    }
  }

  await updateDoc(depositRef, { ...cleanObject(updates), updatedAt: serverTimestamp() });
};

export const fsDeleteDeposit = async (uid: string, depositId: string) => {
  const depositRef = doc(firestore, `users/${uid}/deposits/${depositId}`);
  const depositSnap = await getDoc(depositRef);
  if (!depositSnap.exists()) return;
  const deposit = depositSnap.data() as Deposit;

  const goalRef = doc(firestore, `users/${uid}/goals/${deposit.goalId}`);
  const goalSnap = await getDoc(goalRef);
  
  if (goalSnap.exists()) {
    const goalData = goalSnap.data() as Goal;
    if (goalData.mode === 'challenge' && deposit.denominationValue && deposit.quantity) {
      const updatedDenominations = goalData.denominations?.map(d => {
        if (d.value === deposit.denominationValue) {
          return { ...d, currentQty: Math.max(0, d.currentQty - deposit.quantity!) };
        }
        return d;
      });
      await updateDoc(goalRef, { 
        denominations: updatedDenominations,
        updatedAt: serverTimestamp()
      });
    }
  }

  await deleteDoc(depositRef);
};
