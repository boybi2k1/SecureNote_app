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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { shareService } from '../../services/shareService';
import { NoteCard } from '../../components/NoteCard';
import { Note } from '../../types/note.types';
import { AppStackParamList } from './NotesListScreen';

type SharedNotesScreenNavigationProp = StackNavigationProp<AppStackParamList, 'SharedNotes'>;

export const SharedNotesScreen: React.FC = () => {
  const navigation = useNavigation<SharedNotesScreenNavigationProp>();
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSharedNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shareService.getSharedNotes();
      // Normalize category
      const normalizedData = data.map((note) => ({
        ...note,
        category: note.category_id === null ? null : note.category,
      }));
      setSharedNotes(normalizedData);
    } catch (err: any) {
      let errorMessage = 'Không thể tải notes được chia sẻ';
      
      // Check if it's a backend routing error
      const isRoutingError = err.response?.status === 422 && 
        err.response?.data?.detail?.some?.((d: any) => 
          d.type === 'int_parsing' && d.loc?.includes?.('note_id')
        );
      
      if (isRoutingError) {
        errorMessage = 'Lỗi backend routing: Endpoint /notes/shared bị xung đột với /notes/{note_id}. ' +
          'Vui lòng liên hệ admin để sửa backend routing.';
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          errorMessage = detail.map((item: any) => item.msg || item.message || JSON.stringify(item)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail.message) {
          errorMessage = detail.message;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Load shared notes error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedNotes();
  }, [loadSharedNotes]);

  useFocusEffect(
    useCallback(() => {
      loadSharedNotes();
    }, [loadSharedNotes])
  );

  const handleRefresh = async () => {
    await loadSharedNotes();
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  if (loading && sharedNotes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && sharedNotes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSharedNotes}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sharedNotes}
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
            <Text style={styles.emptyText}>Chưa có notes được chia sẻ</Text>
            <Text style={styles.emptySubtext}>Các notes được chia sẻ với bạn sẽ xuất hiện ở đây</Text>
          </View>
        }
      />
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
});

