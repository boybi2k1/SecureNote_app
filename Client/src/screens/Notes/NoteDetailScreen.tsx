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
import { useNotes } from '../../context/NotesContext';
import { useAuth } from '../../context/AuthContext';
import { notesService } from '../../services/notesService';
import { shareService } from '../../services/shareService';
import { AppStackParamList } from './NotesListScreen';
import { Note } from '../../types/note.types';
import { Permission } from '../../types/share.types';

type NoteDetailScreenRouteProp = RouteProp<AppStackParamList, 'NoteDetail'>;
type NoteDetailScreenNavigationProp = StackNavigationProp<AppStackParamList, 'NoteDetail'>;

export const NoteDetailScreen: React.FC = () => {
  const navigation = useNavigation<NoteDetailScreenNavigationProp>();
  const route = useRoute<NoteDetailScreenRouteProp>();
  const { noteId } = route.params;
  
  const { getNoteById, deleteNote, toggleFavorite } = useNotes();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Permission | null>(null);

  const loadNote = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      let noteData: Note | null = null;
      
      // Nếu force refresh hoặc không có trong context, fetch từ API
      if (forceRefresh) {
        noteData = await notesService.getNoteById(noteId);
      } else {
        // Thử lấy từ context trước
        noteData = getNoteById(noteId);
        
        // Nếu không có trong context, fetch từ API
        if (!noteData) {
          noteData = await notesService.getNoteById(noteId);
        }
      }
      
      // Normalize category để đảm bảo tính nhất quán
      if (noteData) {
        noteData = {
          ...noteData,
          category: noteData.category_id === null ? null : noteData.category,
        };
      }
      
      setNote(noteData);
      
      // Kiểm tra permission:
      // - Nếu note có original_note_id, đây là note được chia sẻ (copy của recipient)
      // - Cần kiểm tra xem user hiện tại có phải là recipient không
      // - Nếu user_id === user.id và có original_note_id, thì user là recipient
      // - Nếu user_id !== user.id và có original_note_id, có thể API trả về note gốc, cần kiểm tra thêm
      if (noteData && user) {
        const hasOriginalNoteId = noteData.original_note_id !== null;
        const isRecipient = hasOriginalNoteId && noteData.user_id === user.id;
        const isOwner = !hasOriginalNoteId && noteData.user_id === user.id;
        
        // Nếu user hiện tại là recipient, cần kiểm tra permission
        // Hoặc nếu note có original_note_id nhưng user_id khác, cũng cần kiểm tra (có thể là note gốc)
        if (isRecipient || (hasOriginalNoteId && !isOwner)) {
          // Note được chia sẻ với user hiện tại, cần lấy permission
          try {
            // Kiểm tra xem note có trong danh sách shared notes với permission 'write' không
            const sharedNotesWrite = await shareService.getSharedNotes('write');
            const hasWritePermission = sharedNotesWrite.some((n) => n.id === noteId);
            
            if (hasWritePermission) {
              setPermission('write');
              console.log('Permission set to write for note:', noteId);
            } else {
              // Kiểm tra xem note có trong danh sách shared notes (tất cả) không
              const sharedNotes = await shareService.getSharedNotes();
              const hasAccess = sharedNotes.some((n) => n.id === noteId);
              
              if (hasAccess) {
                // Có quyền truy cập nhưng không có write permission, vậy là 'read'
                setPermission('read');
                console.log('Permission set to read for note:', noteId);
              } else {
                // Không tìm thấy trong shared notes (có thể do lỗi API)
                // Nhưng vì note có original_note_id và user_id khác, nên mặc định là 'read' để an toàn
                setPermission('read');
                console.log('Note is shared but not found in shared notes list, defaulting to read. Note:', noteId);
              }
            }
          } catch (error) {
            console.error('Error loading permission:', error);
            // Nếu lỗi API, nhưng note có original_note_id và user_id khác, mặc định là 'read' để an toàn
            setPermission('read');
            console.log('Error loading permission, defaulting to read for note:', noteId);
          }
        } else {
          // Note của chính user (không có original_note_id hoặc user_id trùng)
          setPermission(null);
          console.log('Note belongs to current user, no permission restriction. Note:', noteId);
        }
      } else {
        setPermission(null);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải ghi chú');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [noteId, getNoteById, navigation, user]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Tự động reload khi quay lại màn hình (force refresh từ API)
  useFocusEffect(
    useCallback(() => {
      loadNote(true); // Force refresh từ API để đảm bảo có dữ liệu mới nhất
    }, [loadNote])
  );

  const handleEdit = () => {
    // Kiểm tra permission trước khi cho phép edit
    if (permission === 'read') {
      Alert.alert('Không có quyền', 'Bạn chỉ có quyền đọc ghi chú này. Không thể chỉnh sửa.');
      return;
    }
    navigation.navigate('NoteEdit', { noteId });
  };

  const handleDelete = () => {
    // Người được chia sẻ không thể xóa note
    if (permission !== null) {
      Alert.alert('Không có quyền', 'Bạn không có quyền xóa ghi chú được chia sẻ.');
      return;
    }
    
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này? Ghi chú sẽ được chuyển vào thùng rác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa ghi chú');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(noteId);
      // Reload note để cập nhật UI
      await loadNote();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật yêu thích');
    }
  };

  const handleShare = () => {
    // Người được chia sẻ không thể chia sẻ lại note
    if (permission !== null) {
      Alert.alert('Không có quyền', 'Bạn không có quyền chia sẻ ghi chú được chia sẻ với bạn.');
      return;
    }
    navigation.navigate('ShareNote', { noteId });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tìm thấy ghi chú</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{note.title}</Text>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Text style={styles.favoriteIcon}>
              {note.is_favorite ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        {note.category && (
          <View style={[styles.categoryBadge, { backgroundColor: note.category.color + '20' }]}>
            <View style={[styles.categoryDot, { backgroundColor: note.category.color }]} />
            <Text style={styles.categoryText}>{note.category.name}</Text>
          </View>
        )}

        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {note.tags.map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.contentText}>{note.content}</Text>

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Tạo: {formatDate(note.created_at)}</Text>
          <Text style={styles.metaText}>Cập nhật: {formatDate(note.updated_at)}</Text>
          {permission && (
            <Text style={styles.metaText}>Quyền: {permission === 'read' ? 'Chỉ đọc' : 'Đọc và chỉnh sửa'}</Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.shareButton,
              permission !== null && styles.actionButtonDisabled
            ]} 
            onPress={handleShare}
            disabled={permission !== null}
          >
            <Text style={[
              styles.actionButtonText,
              permission !== null && styles.actionButtonTextDisabled
            ]}>Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.editButton,
              permission === 'read' && styles.actionButtonDisabled
            ]} 
            onPress={handleEdit}
            disabled={permission === 'read'}
          >
            <Text style={[
              styles.actionButtonText,
              permission === 'read' && styles.actionButtonTextDisabled
            ]}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.deleteButton,
              permission !== null && styles.actionButtonDisabled
            ]} 
            onPress={handleDelete}
            disabled={permission !== null}
          >
            <Text style={[
              styles.actionButtonText,
              permission !== null && styles.actionButtonTextDisabled
            ]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  errorText: {
    fontSize: 16,
    color: '#c33',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  favoriteIcon: {
    fontSize: 28,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginBottom: 24,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

