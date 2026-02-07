import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useBankAccount = (user) => {
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bankDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'bankAccount');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      bankDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBankAccount(snapshot.data());
        } else {
          setBankAccount(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading bank account:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveBankAccount = async (data) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      await setDoc(bankDocRef, {
        bankName: data.bankName || '',
        balance: parseFloat(data.balance) || 0,
        balanceDate: data.balanceDate || new Date().toISOString().split('T')[0],
        creditLineLimit: parseFloat(data.creditLineLimit) || 0,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      });
      return { success: true };
    } catch (err) {
      console.error("Error saving bank account:", err);
      return { success: false, error: err };
    }
  };

  // Calculate real balance considering transactions after the balance date
  const calculateRealBalance = (transactions) => {
    if (!bankAccount) return { currentBalance: 0, availableCredit: 0, creditUsed: 0 };

    const balanceDate = bankAccount.balanceDate;
    const startingBalance = bankAccount.balance;
    const creditLimit = bankAccount.creditLineLimit; // negative number like -40000

    // Only consider PAID transactions after the balance date
    const transactionsAfterBalance = transactions.filter(t =>
      t.date > balanceDate && t.status === 'paid'
    );

    let netMovement = 0;
    transactionsAfterBalance.forEach(t => {
      if (t.type === 'income') {
        netMovement += t.amount;
      } else {
        netMovement -= t.amount;
      }
    });

    const currentBalance = startingBalance + netMovement;
    const availableCredit = currentBalance - creditLimit; // how much more can be spent
    const creditUsed = currentBalance < 0 ? Math.abs(currentBalance) : 0;

    return {
      startingBalance,
      currentBalance,
      creditLimit,
      availableCredit,
      creditUsed,
      netMovement,
      balanceDate,
      transactionsCount: transactionsAfterBalance.length
    };
  };

  return {
    bankAccount,
    loading,
    error,
    saveBankAccount,
    calculateRealBalance
  };
};

export default useBankAccount;
