import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { USER_ROLES, ROLE_PERMISSIONS } from '../constants/config';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserRole(USER_ROLES[currentUser.email] || 'editor');
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
