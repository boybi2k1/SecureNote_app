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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNotes } from '../../context/NotesContext';
import { useAuth } from '../../context/AuthContext';
import { NoteCard } from '../../components/NoteCard';
import { SearchBar } from '../../components/SearchBar';
import { FilterBar } from '../../components/FilterBar';
import { Note, NoteFilters } from '../../types/note.types';

export type AppStackParamList = {
  NotesList: { categoryId?: number } | undefined;
  NoteDetail: { noteId: number };
  NoteEdit: { noteId?: number };
  TodosList: { categoryId?: number } | undefined;
  TodoDetail: { todoId: number };
  TodoEdit: { todoId?: number };
  CategoriesList: undefined;
  CategoryEdit: { categoryId?: number };
  Calendar: undefined;
  Statistics: undefined;
  Trash: undefined;
  ShareNote: { noteId: number };
  SharedNotes: undefined;
  Settings: undefined;
  Profile: undefined;
  ChangePassword: undefined;
};

type NotesListScreenNavigationProp = StackNavigationProp<AppStackParamList, 'NotesList'>;

export const NotesListScreen: React.FC = () => {
  const navigation = useNavigation<NotesListScreenNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'NotesList'>>();
  const { notes, loading, error, fetchNotes, refreshNotes } = useNotes();
  const { logout, user } = useAuth();
  
  // State cho filters
  const [filters, setFilters] = useState<NoteFilters>(() => {
    // Khởi tạo với categoryId từ route params nếu có
    const categoryId = route.params?.categoryId;
    return categoryId ? { category_id: categoryId } : {};
  });

  // Fetch notes khi filters thay đổi
  useEffect(() => {
    fetchNotes(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.category_id,
    filters.tag_ids?.join(','),
    filters.favorite,
    filters.search,
    filters.is_deleted,
  ]);

  // Tự động reload khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      // Reload với filters hiện tại
      fetchNotes(filters);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      filters.category_id,
      filters.tag_ids?.join(','),
      filters.favorite,
      filters.search,
      filters.is_deleted,
    ])
  );

  // Xử lý khi route params thay đổi (ví dụ: navigate từ CategoriesScreen)
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
    await fetchNotes(filters);
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({
      ...prev,
      search: query.trim() || undefined,
    }));
  };

  const handleFiltersChange = (newFilters: NoteFilters) => {
    setFilters(newFilters);
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  const handleAddNote = () => {
    navigation.navigate('NoteEdit', {});
  };

  const handleCategoriesPress = () => {
    navigation.navigate('CategoriesList');
  };

  const handleTrashPress = () => {
    navigation.navigate('Trash');
  };

  const handleSharedNotesPress = () => {
    navigation.navigate('SharedNotes');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleTodosPress = () => {
    navigation.navigate('TodosList');
  };

  const handleCalendarPress = () => {
    navigation.navigate('Calendar');
  };

  const handleStatisticsPress = () => {
    navigation.navigate('Statistics');
  };

  // Set header options với nút Statistics, Calendar và Settings
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleStatisticsPress}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCalendarPress}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  if (loading && notes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && notes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotes()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar onSearch={handleSearch} placeholder="Tìm kiếm ghi chú..." />
      <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />
      
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => handleNotePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filters.search || filters.category_id || filters.tag_ids?.length || filters.favorite
                ? 'Không tìm thấy ghi chú nào'
                : 'Chưa có ghi chú nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filters.search || filters.category_id || filters.tag_ids?.length || filters.favorite
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm'
                : 'Nhấn nút + để tạo ghi chú mới'}
            </Text>
          </View>
        }
      />
      
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.todosFab]} onPress={handleTodosPress}>
          <Text style={styles.fabIcon}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.sharedFab]} onPress={handleSharedNotesPress}>
          <Text style={styles.fabIcon}>👥</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.trashFab]} onPress={handleTrashPress}>
          <Text style={styles.fabIcon}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.categoriesFab]} onPress={handleCategoriesPress}>
          <Text style={styles.fabIcon}>📁</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={handleAddNote}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
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
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  fab: {
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
  sharedFab: {
    backgroundColor: '#5856D6',
  },
  trashFab: {
    backgroundColor: '#ff9500',
  },
  categoriesFab: {
    backgroundColor: '#34C759',
  },
  todosFab: {
    backgroundColor: '#5856D6',
  },
  fabIcon: {
    fontSize: 24,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  settingsButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});

