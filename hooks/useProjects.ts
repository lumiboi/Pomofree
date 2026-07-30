import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project, User } from '../types';

export const useProjects = (user: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      return;
    }

    const loadProjects = async () => {
      setLoading(true);
      try {
        const projectsRef = collection(db, 'users', user.uid, 'projects');
        const q = query(projectsRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        let loadedProjects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate()
        })) as Project[];
        
        // Create default project if none exist
        if (loadedProjects.length === 0) {
          const defaultProject = {
            name: 'Genel Görevler',
            completed: false,
            createdAt: Timestamp.now()
          };
          
          const docRef = await addDoc(projectsRef, defaultProject);
          loadedProjects = [{
            id: docRef.id,
            ...defaultProject,
            createdAt: new Date()
          }];
        }
        
        setProjects(loadedProjects);
        
        // Set active project to first uncompleted project
        const activeProject = loadedProjects.find(p => !p.completed);
        setActiveProjectId(activeProject?.id || null);
        
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  const addProject = async (name: string) => {
    if (!user || !name.trim()) return;

    try {
      const newProject = {
        name: name.trim(),
        completed: false,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), newProject);
      
      const projectWithId = {
        id: docRef.id,
        ...newProject,
        createdAt: new Date()
      };
      
      setProjects(prev => [projectWithId, ...prev]);
      setActiveProjectId(docRef.id);

      return { success: true, project: projectWithId };
    } catch (error) {
      console.error('Error adding project:', error);
      return { success: false, error: 'Failed to add project' };
    }
  };

  const completeProject = async (projectId: string) => {
    if (!user) return;

    // Don't allow completing the last active project
    const activeProjects = projects.filter(p => !p.completed);
    if (activeProjects.length <= 1) {
      return { success: false, error: 'Son aktif projeyi tamamlayamazsınız' };
    }

    try {
      const batch = writeBatch(db);
      
      // Mark project as completed
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      batch.update(projectRef, { 
        completed: true, 
        completedAt: Timestamp.now() 
      });

      // Delete all tasks in this project
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const tasksSnapshot = await getDocs(tasksRef);
      
      tasksSnapshot.docs.forEach(taskDoc => {
        if (taskDoc.data().projectId === projectId) {
          batch.delete(taskDoc.ref);
        }
      });

      await batch.commit();

      // Update local state
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, completed: true, completedAt: new Date() }
          : p
      ));

      // Set new active project
      const newActiveProject = projects.find(p => p.id !== projectId && !p.completed);
      setActiveProjectId(newActiveProject?.id || null);

      return { success: true };
    } catch (error) {
      console.error('Error completing project:', error);
      return { success: false, error: 'Failed to complete project' };
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;

    // Don't allow deleting the last active project
    const activeProjects = projects.filter(p => !p.completed);
    if (activeProjects.length <= 1) {
      return { success: false, error: 'Son aktif projeyi silemezsiniz' };
    }

    try {
      const batch = writeBatch(db);
      
      // Delete project
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      batch.delete(projectRef);

      // Delete all tasks in this project
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const tasksSnapshot = await getDocs(tasksRef);
      
      tasksSnapshot.docs.forEach(taskDoc => {
        if (taskDoc.data().projectId === projectId) {
          batch.delete(taskDoc.ref);
        }
      });

      await batch.commit();

      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));

      // Set new active project if needed
      if (activeProjectId === projectId) {
        const newActiveProject = projects.find(p => p.id !== projectId && !p.completed);
        setActiveProjectId(newActiveProject?.id || null);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: 'Failed to delete project' };
    }
  };

  const clearCompletedProjects = async () => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      
      projects.filter(p => p.completed).forEach(project => {
        const projectRef = doc(db, 'users', user.uid, 'projects', project.id);
        batch.delete(projectRef);
      });

      await batch.commit();

      setProjects(prev => prev.filter(p => !p.completed));

      return { success: true };
    } catch (error) {
      console.error('Error clearing completed projects:', error);
      return { success: false, error: 'Failed to clear completed projects' };
    }
  };

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    loading,
    addProject,
    completeProject,
    deleteProject,
    clearCompletedProjects
  };
};

