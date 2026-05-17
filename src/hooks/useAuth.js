import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { USER_ROLES, ROLE_PERMISSIONS } from '../constants/config';

const LOCAL_TEST_AUTH_KEY = 'fincontrol.localTestAuth';

const LOCAL_TEST_USER = {
  uid: 'local-test-user',
  email: 'test.local@umtelkomd.test',
  displayName: 'Local Test User',
  isAnonymous: true,
};

const isLocalTestAuthEnabled = () => (
  import.meta.env.DEV && window.localStorage.getItem(LOCAL_TEST_AUTH_KEY) === 'true'
);

/**
 * Reads user role from Firestore `users/{uid}` document.
 * Falls back to config.js email mapping if Firestore doc doesn't exist yet
 * (graceful degradation during bootstrap transition).
 */
const fetchUserRole = async (uid, email) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'editor';
    }
  } catch {
    // Firestore unavailable or doc doesn't exist
  }
  // Fallback to config mapping during bootstrap transition
  return USER_ROLES[email] || 'editor';
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalTestAuthEnabled()) {
      setUser(LOCAL_TEST_USER);
      setUserRole('admin');
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch role from Firestore (async, non-blocking for UI)
        const role = await fetchUserRole(currentUser.uid, currentUser.email);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper: check if current role has permission for a section
  const hasPermission = (section) => {
    if (!userRole) return false;
    const perms = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.editor;
    return perms.includes(section);
  };

  return { user, userRole, hasPermission, loading };
};
