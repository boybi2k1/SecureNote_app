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
import { useTodos } from '../../context/TodosContext';
import { todosService } from '../../services/todosService';
import { CategoryPicker } from '../../components/CategoryPicker';
import { TagInput } from '../../components/TagInput';
import { ReminderPicker } from '../../components/ReminderPicker';
import { DueDatePicker } from '../../components/DueDatePicker';
import { RecurrencePicker, RecurrencePattern } from '../../components/RecurrencePicker';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { CreateTodoDto, UpdateTodoDto } from '../../types/todo.types';
import { Tag } from '../../types/tag.types';
import { toLocalISOString, parseServerDateTime } from '../../utils/dateUtils';

type TodoEditScreenRouteProp = RouteProp<AppStackParamList, 'TodoEdit'>;
type TodoEditScreenNavigationProp = StackNavigationProp<AppStackParamList, 'TodoEdit'>;

export const TodoEditScreen: React.FC = () => {
  const navigation = useNavigation<TodoEditScreenNavigationProp>();
  const route = useRoute<TodoEditScreenRouteProp>();
  const { todoId } = route.params || {};

  const { createTodo, updateTodo, getTodoById } = useTodos();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [originalTags, setOriginalTags] = useState<Tag[]>([]);
  // Recurrence state
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(null);
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [recurrenceEndCount, setRecurrenceEndCount] = useState<number | null>(null);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'date' | 'count'>('never');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!todoId;

  useEffect(() => {
    if (isEditMode && todoId) {
      loadTodo();
    }
  }, [todoId]);

  const loadTodo = async () => {
    try {
      setLoading(true);
      let todo = getTodoById(todoId!);

      if (!todo) {
        todo = await todosService.getTodoById(todoId!);
      }

      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status);
      setPriority(todo.priority);
      setDueDate(todo.due_date ? parseServerDateTime(todo.due_date) : null);
      setReminderAt(todo.reminder_at ? parseServerDateTime(todo.reminder_at) : null);
      setCategoryId(todo.category_id);
      const todoTags = todo.tags || [];
      setSelectedTags(todoTags);
      setOriginalTags(todoTags);
      // Load recurrence data
      setRecurrencePattern(todo.recurrence_pattern || null);
      setRecurrenceInterval(todo.recurrence_interval || 1);
      setRecurrenceEndDate(todo.recurrence_end_date ? parseServerDateTime(todo.recurrence_end_date) : null);
      setRecurrenceEndCount(todo.recurrence_count || null);
      if (todo.recurrence_end_date) {
        setRecurrenceEndType('date');
      } else if (todo.recurrence_count) {
        setRecurrenceEndType('count');
      } else {
        setRecurrenceEndType('never');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải todo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    try {
      setSaving(true);

      const tagIds = selectedTags.map((tag) => tag.id);

      // Prepare recurrence data
      const recurrenceData: any = {};
      if (recurrencePattern) {
        recurrenceData.recurrence_pattern = recurrencePattern;
        recurrenceData.recurrence_interval = recurrenceInterval;
        if (recurrenceEndType === 'date' && recurrenceEndDate) {
          recurrenceData.recurrence_end_date = toLocalISOString(recurrenceEndDate);
        } else if (recurrenceEndType === 'count' && recurrenceEndCount) {
          recurrenceData.recurrence_count = recurrenceEndCount;
        }
      } else {
        // Clear recurrence if pattern is null
        recurrenceData.recurrence_pattern = null;
        recurrenceData.recurrence_end_date = null;
        recurrenceData.recurrence_count = null;
      }

      if (isEditMode && todoId) {
        const updateData: UpdateTodoDto = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          due_date: dueDate ? toLocalISOString(dueDate) : undefined,
          reminder_at: reminderAt ? toLocalISOString(reminderAt) : undefined,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : [],
          ...recurrenceData,
        };
        await updateTodo(todoId, updateData);
      } else {
        const createData: CreateTodoDto = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          due_date: dueDate ? toLocalISOString(dueDate) : undefined,
          reminder_at: reminderAt ? toLocalISOString(reminderAt) : undefined,
          category_id: categoryId || undefined,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          ...recurrenceData,
        };
        await createTodo(createData);
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể lưu todo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề todo"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Nhập mô tả (tùy chọn)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.statusRow}>
              {(['pending', 'in_progress', 'completed'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusButton, status === s && styles.statusButtonActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === s && styles.statusButtonTextActive,
                    ]}
                  >
                    {s === 'pending'
                      ? 'Chờ'
                      : s === 'in_progress'
                      ? 'Đang làm'
                      : 'Hoàn thành'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Độ ưu tiên</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityButton, priority === p && styles.priorityButtonActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && styles.priorityButtonTextActive,
                    ]}
                  >
                    {p === 'urgent'
                      ? 'Khẩn'
                      : p === 'high'
                      ? 'Cao'
                      : p === 'medium'
                      ? 'Trung bình'
                      : 'Thấp'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Hạn chót</Text>
            <DueDatePicker dueDate={dueDate} onDueDateChange={setDueDate} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nhắc nhở</Text>
            <ReminderPicker reminderAt={reminderAt} onReminderChange={setReminderAt} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lặp lại</Text>
            <RecurrencePicker
              pattern={recurrencePattern}
              interval={recurrenceInterval}
              endDate={recurrenceEndDate}
              endCount={recurrenceEndCount}
              endType={recurrenceEndType}
              onPatternChange={setRecurrencePattern}
              onIntervalChange={setRecurrenceInterval}
              onEndDateChange={setRecurrenceEndDate}
              onEndCountChange={setRecurrenceEndCount}
              onEndTypeChange={setRecurrenceEndType}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Danh mục</Text>
            <CategoryPicker
              selectedCategoryId={categoryId}
              onCategoryChange={setCategoryId}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags</Text>
            <TagInput
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});

