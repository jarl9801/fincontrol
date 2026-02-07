import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export const useCategories = (user) => {
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoriesDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'categories');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      categoriesDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setExpenseCategories(data.expenseCategories || EXPENSE_CATEGORIES);
          setIncomeCategories(data.incomeCategories || INCOME_CATEGORIES);
        } else {
          // Initialize with defaults if document doesn't exist
          await setDoc(categoriesDocRef, {
            expenseCategories: EXPENSE_CATEGORIES,
            incomeCategories: INCOME_CATEGORIES,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveCategories = async (newExpenseCategories, newIncomeCategories) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      await setDoc(categoriesDocRef, {
        expenseCategories: newExpenseCategories,
        incomeCategories: newIncomeCategories,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      });
      return { success: true };
    } catch (err) {
      console.error("Error saving categories:", err);
      return { success: false, error: err };
    }
  };

  const addCategory = async (category, type) => {
    if (!user) return { success: false, error: 'No user' };

    const newExpense = type === 'expense'
      ? [...expenseCategories, category]
      : expenseCategories;
    const newIncome = type === 'income'
      ? [...incomeCategories, category]
      : incomeCategories;

    return saveCategories(newExpense, newIncome);
  };

  const updateCategory = async (oldCategory, newCategory, type) => {
    if (!user) return { success: false, error: 'No user' };

    const newExpense = type === 'expense'
      ? expenseCategories.map(c => c === oldCategory ? newCategory : c)
      : expenseCategories;
    const newIncome = type === 'income'
      ? incomeCategories.map(c => c === oldCategory ? newCategory : c)
      : incomeCategories;

    return saveCategories(newExpense, newIncome);
  };

  const deleteCategory = async (category, type) => {
    if (!user) return { success: false, error: 'No user' };

    const newExpense = type === 'expense'
      ? expenseCategories.filter(c => c !== category)
      : expenseCategories;
    const newIncome = type === 'income'
      ? incomeCategories.filter(c => c !== category)
      : incomeCategories;

    return saveCategories(newExpense, newIncome);
  };

  return {
    expenseCategories,
    incomeCategories,
    loading,
    error,
    saveCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};

export default useCategories;
