import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task, User } from '../types';

export const useTasks = (user: User | null, activeProjectId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Load tasks
  useEffect(() => {
    if (!user || !activeProjectId) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      setLoading(true);
      try {
        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(
          tasksRef, 
          where('projectId', '==', activeProjectId),
          where('completed', '==', false),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const loadedTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate()
        })) as Task[];
        
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user, activeProjectId]);

  const addTask = async (text: string) => {
    if (!user || !activeProjectId || !text.trim()) return;

    try {
      const newTask = {
        text: text.trim(),
        completed: false,
        projectId: activeProjectId,
        pomodorosCompleted: 0,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask);
      
      setTasks(prev => [{
        id: docRef.id,
        ...newTask,
        createdAt: new Date()
      }, ...prev]);

      return { success: true };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error: 'Failed to add task' };
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        ...(updates.completed && { completedAt: Timestamp.now() })
      });

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));

      return { success: true };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task' };
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      // Mark as completed instead of deleting
      await updateTask(taskId, { completed: true });
      
      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: 'Failed to delete task' };
    }
  };

  const incrementTaskPomodoro = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCount = (task.pomodorosCompleted || 0) + 1;
    return await updateTask(taskId, { pomodorosCompleted: newCount });
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    incrementTaskPomodoro
  };
};

