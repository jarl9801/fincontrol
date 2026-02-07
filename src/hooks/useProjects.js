import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useProjects = (user) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(projectsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading projects:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createProject = async (projectData) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      await addDoc(projectsRef, {
        ...projectData,
        createdAt: serverTimestamp(),
        createdBy: user.email,
        active: true
      });
      return { success: true };
    } catch (err) {
      console.error("Error creating project:", err);
      return { success: false, error: err };
    }
  };

  const updateProject = async (projectId, updates) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const projectDoc = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId);
      await updateDoc(projectDoc, {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      });
      return { success: true };
    } catch (err) {
      console.error("Error updating project:", err);
      return { success: false, error: err };
    }
  };

  const deleteProject = async (projectId) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const projectDoc = doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId);
      await deleteDoc(projectDoc);
      return { success: true };
    } catch (err) {
      console.error("Error deleting project:", err);
      return { success: false, error: err };
    }
  };

  const toggleProjectStatus = async (projectId, currentStatus) => {
    return updateProject(projectId, { active: !currentStatus });
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectStatus
  };
};

export default useProjects;
