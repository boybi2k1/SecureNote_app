import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTodos } from '../../context/TodosContext';
import { todosService } from '../../services/todosService';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { Todo } from '../../types/todo.types';

type TodoDetailScreenRouteProp = RouteProp<AppStackParamList, 'TodoDetail'>;
type TodoDetailScreenNavigationProp = StackNavigationProp<AppStackParamList, 'TodoDetail'>;

export const TodoDetailScreen: React.FC = () => {
  const navigation = useNavigation<TodoDetailScreenNavigationProp>();
  const route = useRoute<TodoDetailScreenRouteProp>();
  const { todoId } = route.params;

  const { getTodoById, deleteTodo, toggleComplete, toggleFavorite } = useTodos();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTodo = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      let todoData: Todo | null = null;

      if (forceRefresh) {
        todoData = await todosService.getTodoById(todoId);
      } else {
        todoData = getTodoById(todoId);
        if (!todoData) {
          todoData = await todosService.getTodoById(todoId);
        }
      }

      if (todoData) {
        todoData = {
          ...todoData,
          category: todoData.category_id === null ? null : todoData.category,
        };
      }

      setTodo(todoData);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải todo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [todoId, getTodoById, navigation]);

  useEffect(() => {
    loadTodo();
  }, [loadTodo]);

  useFocusEffect(
    useCallback(() => {
      loadTodo(true);
    }, [loadTodo])
  );

  const handleEdit = () => {
    navigation.navigate('TodoEdit', { todoId });
  };

  const handleDelete = () => {
    Alert.alert('Xóa Todo', 'Bạn có chắc chắn muốn xóa todo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodo(todoId);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể xóa todo');
          }
        },
      },
    ]);
  };

  const handleToggleComplete = async () => {
    try {
      await toggleComplete(todoId);
      loadTodo(true);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể cập nhật trạng thái');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(todoId);
      loadTodo(true);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể cập nhật yêu thích');
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{todo?.is_favorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, todo?.is_favorite]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!todo) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy todo</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadTodo(true)}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#ff3b30';
      case 'high':
        return '#ff9500';
      case 'medium':
        return '#ffcc00';
      case 'low':
        return '#34c759';
      default:
        return '#8e8e93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ';
      case 'in_progress':
        return 'Đang làm';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const priorityColor = getPriorityColor(todo.priority);
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.completeButton, todo.is_completed && styles.completedButton]}
            onPress={handleToggleComplete}
          >
            <Text style={styles.completeIcon}>{todo.is_completed ? '✓' : '○'}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, todo.is_completed && styles.completedTitle]}>
            {todo.title}
          </Text>
        </View>

        {todo.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{todo.description}</Text>
          </View>
        )}

        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
            <View style={[styles.badgeDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {todo.priority === 'urgent'
                ? 'Khẩn'
                : todo.priority === 'high'
                ? 'Cao'
                : todo.priority === 'medium'
                ? 'Trung bình'
                : 'Thấp'}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: '#007AFF20' }]}>
            <Text style={[styles.badgeText, { color: '#007AFF' }]}>
              {getStatusText(todo.status)}
            </Text>
          </View>
        </View>

        {todo.due_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hạn chót</Text>
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              {formatDate(todo.due_date)}
              {isOverdue && ' (Quá hạn)'}
            </Text>
          </View>
        )}

        {todo.category && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={[styles.categoryBadge, { backgroundColor: todo.category.color + '20' }]}>
              <View style={[styles.categoryDot, { backgroundColor: todo.category.color }]} />
              <Text style={styles.categoryText}>{todo.category.name}</Text>
            </View>
          </View>
        )}

        {todo.tags && todo.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {todo.tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {todo.subtasks && todo.subtasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subtasks</Text>
            {todo.subtasks.map((item) => (
              <View key={item.id} style={styles.subtaskItem}>
                <Text style={styles.subtaskIcon}>{item.is_completed ? '✓' : '○'}</Text>
                <Text
                  style={[styles.subtaskText, item.is_completed && styles.completedSubtask]}
                >
                  {item.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Tạo: {formatDate(todo.created_at) || 'N/A'}
          </Text>
          <Text style={styles.metadataText}>
            Cập nhật: {formatDate(todo.updated_at) || 'N/A'}
          </Text>
          {todo.completed_at && (
            <Text style={styles.metadataText}>
              Hoàn thành: {formatDate(todo.completed_at) || 'N/A'}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Xóa Todo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c33',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedButton: {
    backgroundColor: '#34c759',
    borderColor: '#34c759',
  },
  completeIcon: {
    fontSize: 20,
    color: '#34c759',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 16,
    color: '#333',
  },
  overdue: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subtaskIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#34c759',
  },
  subtaskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  metadata: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  headerButtonText: {
    fontSize: 20,
  },
});





