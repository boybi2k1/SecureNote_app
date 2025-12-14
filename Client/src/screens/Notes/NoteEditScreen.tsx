import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNotes } from '../../context/NotesContext';
import { notesService } from '../../services/notesService';
import { tagsService } from '../../services/tagsService';
import { validation } from '../../utils/validation';
import { CategoryPicker } from '../../components/CategoryPicker';
import { TagInput } from '../../components/TagInput';
import { AppStackParamList } from './NotesListScreen';
import { CreateNoteDto, UpdateNoteDto } from '../../types/note.types';
import { Tag } from '../../types/tag.types';

type NoteEditScreenRouteProp = RouteProp<AppStackParamList, 'NoteEdit'>;
type NoteEditScreenNavigationProp = StackNavigationProp<AppStackParamList, 'NoteEdit'>;

export const NoteEditScreen: React.FC = () => {
  const navigation = useNavigation<NoteEditScreenNavigationProp>();
  const route = useRoute<NoteEditScreenRouteProp>();
  const { noteId } = route.params || {};
  
  const { createNote, updateNote, getNoteById } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [originalTags, setOriginalTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!noteId;

  useEffect(() => {
    if (isEditMode && noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      let note = getNoteById(noteId!);
      
      if (!note) {
        note = await notesService.getNoteById(noteId!);
      }
      
      setTitle(note.title);
      setContent(note.content);
      setCategoryId(note.category_id);
      const noteTags = note.tags || [];
      setSelectedTags(noteTags);
      setOriginalTags(noteTags);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải ghi chú');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    const titleValidation = validation.validateNoteTitle(title.trim());
    if (!titleValidation.valid) {
      Alert.alert('Lỗi', titleValidation.message || 'Tiêu đề không hợp lệ');
      return;
    }

    const contentValidation = validation.validateNoteContent(content);
    if (!contentValidation.valid) {
      Alert.alert('Lỗi', contentValidation.message || 'Nội dung không hợp lệ');
      return;
    }

    try {
      setSaving(true);
      
      const tagIds = selectedTags.map((tag) => tag.id);
      console.log('📝 Saving note with tags:', { tagIds, selectedTags: selectedTags.map(t => t.name) });

      if (isEditMode && noteId) {
        // Update note - thử gửi tag_ids trực tiếp trong body
        const updateData: UpdateNoteDto = {
          title: title.trim(),
          content: content,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : [], // Gửi empty array để xóa tags nếu không có
        };
        console.log('🔄 Updating note:', { noteId, updateData });
        const updatedNote = await updateNote(noteId, updateData);
        console.log('✅ Note updated:', updatedNote);
        
        // Nếu API không hỗ trợ tag_ids trong update, thử cách khác
        if (!updatedNote.tags || updatedNote.tags.length !== tagIds.length) {
          console.log('⚠️ Tags không được cập nhật qua update API, thử API riêng...');
          const originalTagIds = originalTags.map((t) => t.id);
          
          // Xóa tags không còn trong danh sách mới
          const tagsToRemove = originalTagIds.filter((id) => !tagIds.includes(id));
          console.log('🗑️ Removing tags:', tagsToRemove);
          for (const tagId of tagsToRemove) {
            try {
              await tagsService.removeTagFromNote(noteId, tagId);
              console.log('✅ Removed tag:', tagId);
            } catch (err: any) {
              console.error('❌ Error removing tag:', tagId, err.response?.data || err.message);
            }
          }

          // Thêm tags mới
          const tagsToAdd = tagIds.filter((id) => !originalTagIds.includes(id));
          console.log('➕ Adding tags:', tagsToAdd);
          if (tagsToAdd.length > 0) {
            try {
              await tagsService.addTagsToNote(noteId, tagsToAdd);
              console.log('✅ Added tags successfully');
            } catch (err: any) {
              console.error('❌ Error adding tags:', err.response?.data || err.message);
              Alert.alert('Cảnh báo', 'Ghi chú đã được lưu nhưng tags có thể chưa được cập nhật. ' + (err.response?.data?.detail || err.message));
            }
          }
        }
      } else {
        // Create note - thử gửi tag_ids trực tiếp trong body
        const createData: CreateNoteDto = {
          title: title.trim(),
          content: content,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
        };
        console.log('➕ Creating note:', createData);
        const newNote = await createNote(createData);
        console.log('✅ Note created:', newNote);
        
        // Nếu API không hỗ trợ tag_ids trong create, thử cách khác
        if (tagIds.length > 0 && (!newNote.tags || newNote.tags.length !== tagIds.length)) {
          console.log('⚠️ Tags không được tạo qua create API, thử API riêng...');
          try {
            await tagsService.addTagsToNote(newNote.id, tagIds);
            console.log('✅ Added tags via separate API');
          } catch (err: any) {
            console.error('❌ Error adding tags:', err.response?.data || err.message);
            Alert.alert('Cảnh báo', 'Ghi chú đã được tạo nhưng tags có thể chưa được thêm. ' + (err.response?.data?.detail || err.message));
          }
        }
      }
      
      navigation.goBack();
    } catch (err: any) {
      console.error('Error saving note:', err);
      Alert.alert('Lỗi', err.response?.data?.detail || err.message || 'Không thể lưu ghi chú');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Hủy chỉnh sửa',
        'Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất.',
        [
          { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
          { text: 'Hủy', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const titleCharCount = title.length;
  const contentCharCount = content.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Nhập tiêu đề (1-500 ký tự)"
              value={title}
              onChangeText={setTitle}
              maxLength={500}
              editable={!saving}
            />
            <Text style={styles.charCount}>
              {titleCharCount}/500
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nội dung *</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Nhập nội dung (tối đa 100,000 ký tự)"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
              maxLength={100000}
              editable={!saving}
            />
            <Text style={styles.charCount}>
              {contentCharCount.toLocaleString()}/100,000
            </Text>
          </View>

          <CategoryPicker
            selectedCategoryId={categoryId}
            onSelect={setCategoryId}
          />

          <TagInput
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fafafa',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

