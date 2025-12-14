import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTodos } from '../../context/TodosContext';
import { TodoCard } from '../../components/TodoCard';
import { SearchBar } from '../../components/SearchBar';
import { FilterBar } from '../../components/FilterBar';
import { Todo, TodoFilters } from '../../types/todo.types';
import { AppStackParamList } from '../Notes/NotesListScreen';

type TodosListScreenNavigationProp = StackNavigationProp<AppStackParamList, 'TodosList'>;

export const TodosListScreen: React.FC = () => {
  const navigation = useNavigation<TodosListScreenNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'TodosList'>>();
  const { todos, loading, error, fetchTodos, refreshTodos } = useTodos();

  // State cho filters
  const [filters, setFilters] = useState<TodoFilters>(() => {
    const categoryId = route.params?.categoryId;
    return categoryId ? { category_id: categoryId } : {};
  });

  // Fetch todos khi filters thay đổi
  useEffect(() => {
    fetchTodos(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.category_id,
    filters.tag_ids?.join(','),
    filters.favorite,
    filters.status,
    filters.priority,
    filters.search,
    filters.is_deleted,
  ]);

  // Tự động reload khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchTodos(filters);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      filters.category_id,
      filters.tag_ids?.join(','),
      filters.favorite,
      filters.status,
      filters.priority,
      filters.search,
      filters.is_deleted,
    ])
  );

  // Xử lý khi route params thay đổi
  useEffect(() => {
    const categoryId = route.params?.categoryId;
    if (categoryId !== undefined) {
      setFilters((prev) => ({
        ...prev,
        category_id: categoryId,
      }));
    }
  }, [route.params?.categoryId]);

  const handleRefresh = async () => {
    await fetchTodos(filters);
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({
      ...prev,
      search: query.trim() || undefined,
    }));
  };

  const handleFiltersChange = (newFilters: TodoFilters) => {
    setFilters(newFilters);
  };

  const handleTodoPress = (todo: Todo) => {
    navigation.navigate('TodoDetail', { todoId: todo.id });
  };

  const handleAddTodo = () => {
    navigation.navigate('TodoEdit', {});
  };

  if (loading && todos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && todos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchTodos()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} placeholder="Tìm kiếm todo..." />
      <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TodoCard todo={item} onPress={() => handleTodoPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filters.search ||
              filters.category_id ||
              filters.tag_ids?.length ||
              filters.favorite ||
              filters.status ||
              filters.priority
                ? 'Không tìm thấy todo nào'
                : 'Chưa có todo nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filters.search ||
              filters.category_id ||
              filters.tag_ids?.length ||
              filters.favorite ||
              filters.status ||
              filters.priority
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm'
                : 'Nhấn nút + để tạo todo mới'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddTodo}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});

