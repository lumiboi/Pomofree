import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Project } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  projects: Project[];
  activeProjectId: string | null;
  activeTaskId: string | null;
  onAddTask: (text: string) => Promise<any>;
  onDeleteTask: (taskId: string) => Promise<any>;
  onSetActiveTask: (taskId: string | null) => void;
  onSetActiveProject: (projectId: string) => void;
  onAddProject: (name: string) => Promise<any>;
  onCompleteProject: (projectId: string) => Promise<any>;
  onDeleteProject: (projectId: string) => Promise<any>;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  projects,
  activeProjectId,
  activeTaskId,
  onAddTask,
  onDeleteTask,
  onSetActiveTask,
  onSetActiveProject,
  onAddProject,
  onCompleteProject,
  onDeleteProject,
}) => {
  const [taskInput, setTaskInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;
    
    const result = await onAddTask(taskInput.trim());
    if (result.success) {
      setTaskInput('');
    } else {
      Alert.alert('Hata', result.error);
    }
  };

  const handleAddProject = async () => {
    if (!projectInput.trim()) return;
    
    const result = await onAddProject(projectInput.trim());
    if (result.success) {
      setProjectInput('');
      setShowProjectInput(false);
    } else {
      Alert.alert('Hata', result.error);
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    Alert.alert(
      'Proje Tamamla',
      'Bu projeyi tamamlamak istediğinizden emin misiniz? Tüm görevler silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamamla',
          style: 'destructive',
          onPress: async () => {
            const result = await onCompleteProject(projectId);
            if (!result.success) {
              Alert.alert('Hata', result.error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteProject = async (projectId: string) => {
    Alert.alert(
      'Proje Sil',
      'Bu projeyi silmek istediğinizden emin misiniz? Tüm görevler kaybolacaktır.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const result = await onDeleteProject(projectId);
            if (!result.success) {
              Alert.alert('Hata', result.error);
            }
          }
        }
      ]
    );
  };

  const activeProjects = projects.filter(p => !p.completed);
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <View style={styles.container}>
      {/* Project Selector */}
      <View style={styles.projectSection}>
        <Text style={styles.sectionTitle}>📁 Projeler</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
          {activeProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectChip,
                activeProjectId === project.id && styles.activeProjectChip
              ]}
              onPress={() => onSetActiveProject(project.id)}
            >
              <Text style={[
                styles.projectChipText,
                activeProjectId === project.id && styles.activeProjectChipText
              ]}>
                {project.name}
              </Text>
              <TouchableOpacity
                style={styles.projectMenuButton}
                onPress={() => {
                  Alert.alert(
                    project.name,
                    'Proje işlemleri',
                    [
                      { text: 'İptal', style: 'cancel' },
                      { 
                        text: 'Tamamla', 
                        onPress: () => handleCompleteProject(project.id) 
                      },
                      { 
                        text: 'Sil', 
                        style: 'destructive',
                        onPress: () => handleDeleteProject(project.id) 
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.addProjectButton}
            onPress={() => setShowProjectInput(true)}
          >
            <Ionicons name="add" size={20} color="#666" />
          </TouchableOpacity>
        </ScrollView>

        {showProjectInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Yeni proje adı..."
              value={projectInput}
              onChangeText={setProjectInput}
              autoFocus
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddProject}>
              <Ionicons name="checkmark" size={20} color="#4ECDC4" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowProjectInput(false);
                setProjectInput('');
              }}
            >
              <Ionicons name="close" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Task Section */}
      {activeProjectId && (
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>
            ✅ {activeProject?.name} Görevleri
          </Text>

          {/* Add Task Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Yeni görev ekle..."
              value={taskInput}
              onChangeText={setTaskInput}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
              <Ionicons name="add" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          </View>

          {/* Task List */}
          <ScrollView style={styles.taskList}>
            {tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  activeTaskId === task.id && styles.activeTaskItem
                ]}
                onPress={() => onSetActiveTask(activeTaskId === task.id ? null : task.id)}
              >
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskText,
                    activeTaskId === task.id && styles.activeTaskText
                  ]}>
                    {task.text}
                  </Text>
                  {task.pomodorosCompleted > 0 && (
                    <Text style={styles.pomodoroCount}>
                      🍅 {task.pomodorosCompleted}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDeleteTask(task.id)}
                >
                  <Ionicons name="checkmark" size={18} color="#4ECDC4" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            
            {tasks.length === 0 && (
              <Text style={styles.emptyText}>
                Henüz görev yok. Yukarıdan görev ekleyebilirsiniz.
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  projectSection: {
    marginBottom: 20,
  },
  taskSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  projectScroll: {
    marginBottom: 10,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  activeProjectChip: {
    backgroundColor: '#4ECDC4',
  },
  projectChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 5,
  },
  activeProjectChipText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  projectMenuButton: {
    padding: 2,
  },
  addProjectButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    maxHeight: 200,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
  },
  activeTaskItem: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  activeTaskText: {
    fontWeight: 'bold',
  },
  pomodoroCount: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

