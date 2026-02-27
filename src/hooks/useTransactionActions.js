import { addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useTransactionActions = (user) => {
  const transactionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');

  const createTransaction = async (formData) => {
    if (!user) return;

    try {
      const notes = [
        {
          text: `Transacción creada por ${user.email}`,
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'system'
        }
      ];

      // Si hay comentario inicial, agregarlo como nota
      if (formData.comment && formData.comment.trim()) {
        notes.push({
          text: formData.comment.trim(),
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'comment'
        });
      }

      const transactionData = {
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        project: formData.project,
        costCenter: formData.costCenter || 'Sin asignar',
        status: formData.status,
        notes: notes,
        isRecurring: formData.isRecurring || false,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
        hasUnreadUpdates: formData.comment ? true : false,
        lastModifiedBy: user.email,
        lastModifiedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(transactionsRef, transactionData);
      return { success: true };
    } catch (error) {
      console.error("Error creating transaction:", error);
      return { success: false, error };
    }
  };

  const updateTransaction = async (transactionId, formData, existingNotes = []) => {
    if (!user) return;

    try {
      const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transactionId);
      
      const newNotes = [
        ...existingNotes,
        {
          text: `Transacción editada por ${user.email}`,
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'system'
        }
      ];

      // Si hay comentario, agregarlo al array de notes (no reemplazar)
      if (formData.comment && formData.comment.trim()) {
        newNotes.push({
          text: formData.comment.trim(),
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'comment'
        });
      }

      await updateDoc(transactionDoc, {
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        project: formData.project,
        costCenter: formData.costCenter || 'Sin asignar',
        status: formData.status,
        notes: newNotes,
        isRecurring: formData.isRecurring || false,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : null,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
        hasUnreadUpdates: true,
        lastModifiedBy: user.email,
        lastModifiedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating transaction:", error);
      return { success: false, error };
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!user) return;

    try {
      const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transactionId);
      await deleteDoc(transactionDoc);
      return { success: true };
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return { success: false, error };
    }
  };

  const toggleStatus = async (transaction) => {
    if (!user) return;

    try {
      const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transaction.id);
      const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
      
      await updateDoc(transactionDoc, {
        status: newStatus,
        notes: arrayUnion({
          text: `Estado cambiado a ${newStatus === 'paid' ? 'Pagado' : 'Pendiente'} por ${user.email}`,
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'system'
        }),
        hasUnreadUpdates: true,
        lastModifiedBy: user.email,
        lastModifiedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error toggling status:", error);
      return { success: false, error };
    }
  };

  const addNote = async (transaction, noteText) => {
    if (!user || !noteText.trim()) return { success: false };

    try {
      const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transaction.id);

      await updateDoc(transactionDoc, {
        notes: arrayUnion({
          text: noteText.trim(),
          timestamp: new Date().toISOString(),
          user: user.email,
          type: 'comment'
        }),
        hasUnreadUpdates: true,
        lastModifiedBy: user.email,
        lastModifiedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error adding note:", error);
      return { success: false, error };
    }
  };

  const markAsRead = async (transactionId) => {
    if (!user) return;

    try {
      const transactionDoc = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', transactionId);
      await updateDoc(transactionDoc, {
        hasUnreadUpdates: false
      });
      return { success: true };
    } catch (error) {
      console.error("Error marking as read:", error);
      return { success: false, error };
    }
  };

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    toggleStatus,
    addNote,
    markAsRead
  };
};
