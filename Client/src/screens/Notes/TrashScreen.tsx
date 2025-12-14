import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNotes } from '../../context/NotesContext';
import { useTodos } from '../../context/TodosContext';
import { notesService } from '../../services/notesService';
import { todosService } from '../../services/todosService';
import { NoteCard } from '../../components/NoteCard';
import { TodoCard } from '../../components/TodoCard';
import { Note } from '../../types/note.types';
import { Todo } from '../../types/todo.types';
import { AppStackParamList } from './NotesListScreen';

type TrashScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Trash'>;

export const TrashScreen: React.FC = () => {
  const navigation = useNavigation<TrashScreenNavigationProp>();
  const { restoreNote, permanentDeleteNote } = useNotes();
  const { restoreTodo, permanentDeleteTodo } = useTodos();
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [trashTodos, setTrashTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'todos'>('notes');

  const loadTrashNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notesService.getTrashNotes();
      // Normalize category
      const normalizedData = data.map((note) => ({
        ...note,
        category: note.category_id === null ? null : note.category,
      }));
      setTrashNotes(normalizedData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải thùng rác';
      setError(errorMessage);
      console.error('Load trash notes error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrashTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todosService.getTrashTodos();
      // Normalize category
      const normalizedData = data.map((todo) => ({
        ...todo,
        category: todo.category_id === null ? null : todo.category,
      }));
      setTrashTodos(normalizedData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể tải thùng rác';
      setError(errorMessage);
      console.error('Load trash todos error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrash = useCallback(async () => {
    await Promise.all([loadTrashNotes(), loadTrashTodos()]);
  }, [loadTrashNotes, loadTrashTodos]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Tự động reload khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      loadTrash();
    }, [loadTrash])
  );

  const handleRefresh = async () => {
    await loadTrash();
  };

  const handleNotePress = (note: Note) => {
    // Navigate to detail screen (read-only)
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  const handleRestore = (note: Note) => {
    Alert.alert(
      'Khôi phục ghi chú',
      `Bạn có chắc chắn muốn khôi phục ghi chú "${note.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: async () => {
            try {
              await restoreNote(note.id);
              // Reload trash notes
              await loadTrashNotes();
              Alert.alert('Thành công', 'Ghi chú đã được khôi phục');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể khôi phục ghi chú');
            }
          },
        },
      ]
    );
  };

  const handlePermanentDelete = (note: Note) => {
    Alert.alert(
      'Xóa vĩnh viễn',
      `Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú "${note.title}"? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentDeleteNote(note.id);
              // Reload trash
              await loadTrash();
              Alert.alert('Thành công', 'Ghi chú đã được xóa vĩnh viễn');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể xóa vĩnh viễn ghi chú');
            }
          },
        },
      ]
    );
  };

  const handleTodoPress = (todo: Todo) => {
    navigation.navigate('TodoDetail', { todoId: todo.id });
  };

  const handleRestoreTodo = (todo: Todo) => {
    Alert.alert(
      'Khôi phục todo',
      `Bạn có chắc chắn muốn khôi phục todo "${todo.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: async () => {
            try {
              await restoreTodo(todo.id);
              // Reload trash
              await loadTrash();
              Alert.alert('Thành công', 'Todo đã được khôi phục');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể khôi phục todo');
            }
          },
        },
      ]
    );
  };

  const handlePermanentDeleteTodo = (todo: Todo) => {
    Alert.alert(
      'Xóa vĩnh viễn',
      `Bạn có chắc chắn muốn xóa vĩnh viễn todo "${todo.title}"? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentDeleteTodo(todo.id);
              // Reload trash
              await loadTrash();
              Alert.alert('Thành công', 'Todo đã được xóa vĩnh viễn');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể xóa vĩnh viễn todo');
            }
          },
        },
      ]
    );
  };

  if (loading && trashNotes.length === 0 && trashTodos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && trashNotes.length === 0 && trashTodos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTrashNotes}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentData = activeTab === 'notes' ? trashNotes : trashTodos;
  const isEmpty = trashNotes.length === 0 && trashTodos.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            Ghi chú ({trashNotes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'todos' && styles.tabActive]}
          onPress={() => setActiveTab('todos')}
        >
          <Text style={[styles.tabText, activeTab === 'todos' && styles.tabTextActive]}>
            Todos ({trashTodos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notes' ? (
        <FlatList
          data={trashNotes}
          keyExtractor={(item) => `note-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.noteContainer}>
              <TouchableOpacity
                style={styles.noteCardWrapper}
                onPress={() => handleNotePress(item)}
                activeOpacity={0.7}
              >
                <NoteCard note={item} onPress={() => handleNotePress(item)} />
              </TouchableOpacity>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.restoreButton]}
                  onPress={() => handleRestore(item)}
                >
                  <Text style={styles.actionButtonText}>Khôi phục</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handlePermanentDelete(item)}
                >
                  <Text style={styles.actionButtonText}>Xóa vĩnh viễn</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Thùng rác trống</Text>
              <Text style={styles.emptySubtext}>Các ghi chú đã xóa sẽ xuất hiện ở đây</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={trashTodos}
          keyExtractor={(item) => `todo-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.noteContainer}>
              <TouchableOpacity
                style={styles.noteCardWrapper}
                onPress={() => handleTodoPress(item)}
                activeOpacity={0.7}
              >
                <TodoCard todo={item} onPress={() => handleTodoPress(item)} />
              </TouchableOpacity>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.restoreButton]}
                  onPress={() => handleRestoreTodo(item)}
                >
                  <Text style={styles.actionButtonText}>Khôi phục</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handlePermanentDeleteTodo(item)}
                >
                  <Text style={styles.actionButtonText}>Xóa vĩnh viễn</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Thùng rác trống</Text>
              <Text style={styles.emptySubtext}>Các todo đã xóa sẽ xuất hiện ở đây</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContent: {
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
  noteContainer: {
    marginBottom: 16,
  },
  noteCardWrapper: {
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

