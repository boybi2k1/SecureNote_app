import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { shareService } from '../../services/shareService';
import { UserSearchInput } from '../../components/UserSearchInput';
import { AppStackParamList } from './NotesListScreen';
import { SharedNote, Permission } from '../../types/share.types';

type ShareNoteScreenRouteProp = RouteProp<AppStackParamList, 'ShareNote'>;
type ShareNoteScreenNavigationProp = StackNavigationProp<AppStackParamList, 'ShareNote'>;

export const ShareNoteScreen: React.FC = () => {
  const navigation = useNavigation<ShareNoteScreenNavigationProp>();
  const route = useRoute<ShareNoteScreenRouteProp>();
  const { noteId } = route.params;

  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<Permission>('read');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const loadSharedNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shareService.getSharedByMe();
      // Filter only notes shared for this specific noteId
      const filtered = data.filter((sn) => sn.original_note_id === noteId);
      setSharedNotes(filtered);
    } catch (err: any) {
      console.error('Load shared notes error:', err);
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải danh sách chia sẻ');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    loadSharedNotes();
  }, [loadSharedNotes]);

  useFocusEffect(
    useCallback(() => {
      loadSharedNotes();
    }, [loadSharedNotes])
  );

  const handleUserSelect = (username: string) => {
    setSelectedUsername(username);
  };

  const handleShare = async () => {
    if (!selectedUsername.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn user để chia sẻ');
      return;
    }

    try {
      setSharing(true);
      await shareService.shareNote(noteId, {
        recipient_username: selectedUsername.trim(),
        permission: selectedPermission,
      });
      setSelectedUsername('');
      setSelectedPermission('read');
      await loadSharedNotes();
      Alert.alert('Thành công', 'Ghi chú đã được chia sẻ');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Không thể chia sẻ ghi chú';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = (recipientId: number, username: string) => {
    Alert.alert(
      'Hủy chia sẻ',
      `Bạn có chắc chắn muốn hủy chia sẻ với user "${username}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hủy chia sẻ',
          style: 'destructive',
          onPress: async () => {
            try {
              await shareService.unshareNote(noteId, recipientId);
              await loadSharedNotes();
              Alert.alert('Thành công', 'Đã hủy chia sẻ');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể hủy chia sẻ');
            }
          },
        },
      ]
    );
  };

  const handleChangePermission = (recipientId: number, currentPermission: Permission) => {
    const newPermission: Permission = currentPermission === 'read' ? 'write' : 'read';
    Alert.alert(
      'Thay đổi quyền',
      `Bạn có muốn thay đổi quyền thành "${newPermission === 'read' ? 'Chỉ đọc' : 'Đọc và chỉnh sửa'}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thay đổi',
          onPress: async () => {
            try {
              await shareService.updateSharePermission(noteId, recipientId, {
                permission: newPermission,
              });
              await loadSharedNotes();
              Alert.alert('Thành công', 'Đã thay đổi quyền');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể thay đổi quyền');
            }
          },
        },
      ]
    );
  };

  const getExcludedUsernames = (): string[] => {
    // Get usernames from shared notes (we don't have username in SharedNote, so we'll need to handle this differently)
    // For now, return empty array - in real implementation, you might want to fetch user info
    return [];
  };

  const renderHeader = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chia sẻ với user mới</Text>
        
        <UserSearchInput
          onUserSelect={handleUserSelect}
          excludeUsers={getExcludedUsernames()}
          placeholder="Tìm kiếm user để chia sẻ..."
        />

        {selectedUsername && (
          <View style={styles.selectedUserContainer}>
            <Text style={styles.selectedUserText}>Đã chọn: @{selectedUsername}</Text>
          </View>
        )}

        <View style={styles.permissionContainer}>
          <Text style={styles.label}>Quyền truy cập:</Text>
          <View style={styles.permissionButtons}>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                selectedPermission === 'read' && styles.permissionButtonActive,
              ]}
              onPress={() => setSelectedPermission('read')}
            >
              <Text
                style={[
                  styles.permissionButtonText,
                  selectedPermission === 'read' && styles.permissionButtonTextActive,
                ]}
              >
                Chỉ đọc
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                selectedPermission === 'write' && styles.permissionButtonActive,
              ]}
              onPress={() => setSelectedPermission('write')}
            >
              <Text
                style={[
                  styles.permissionButtonText,
                  selectedPermission === 'write' && styles.permissionButtonTextActive,
                ]}
              >
                Đọc và chỉnh sửa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, (!selectedUsername || sharing) && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={!selectedUsername || sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareButtonText}>Chia sẻ</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đã chia sẻ với</Text>
        
        {loading && sharedNotes.length === 0 ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : sharedNotes.length === 0 ? (
          <Text style={styles.emptyText}>Chưa chia sẻ với ai</Text>
        ) : null}
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: SharedNote }) => (
    <View style={styles.sharedItem}>
      <View style={styles.sharedItemContent}>
        <Text style={styles.sharedItemText}>User ID: {item.recipient_id}</Text>
        <Text style={styles.permissionBadge}>
          {item.permission === 'read' ? 'Chỉ đọc' : 'Đọc và chỉnh sửa'}
        </Text>
      </View>
      <View style={styles.sharedItemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleChangePermission(item.recipient_id, item.permission)}
        >
          <Text style={styles.actionButtonText}>Đổi quyền</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.unshareButton]}
          onPress={() => handleUnshare(item.recipient_id, `User ${item.recipient_id}`)}
        >
          <Text style={styles.actionButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListEmptyComponent = () => {
    if (loading) {
      return null; // Loading is shown in header
    }
    return null; // Empty state is shown in header
  };

  return (
    <FlatList
      style={styles.container}
      data={sharedNotes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderListEmptyComponent}
      contentContainerStyle={sharedNotes.length === 0 ? styles.emptyListContainer : undefined}
    />
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
  emptyListContainer: {
    flexGrow: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  selectedUserContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedUserText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  permissionContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  permissionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  permissionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  permissionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  permissionButtonTextActive: {
    color: '#fff',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#ccc',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sharedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sharedItemContent: {
    flex: 1,
  },
  sharedItemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  permissionBadge: {
    fontSize: 12,
    color: '#666',
  },
  sharedItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  unshareButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

