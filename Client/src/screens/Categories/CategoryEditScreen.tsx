import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCategories } from '../../context/CategoriesContext';
import { categoriesService } from '../../services/categoriesService';
import { validation } from '../../utils/validation';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { CreateCategoryDto, UpdateCategoryDto } from '../../types/category.types';

type CategoryEditScreenRouteProp = RouteProp<AppStackParamList, 'CategoryEdit'>;
type CategoryEditScreenNavigationProp = StackNavigationProp<AppStackParamList, 'CategoryEdit'>;

const DEFAULT_COLORS = [
  '#3498db', // Blue
  '#e74c3c', // Red
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#e67e22', // Dark Orange
  '#34495e', // Dark Blue
];

export const CategoryEditScreen: React.FC = () => {
  const navigation = useNavigation<CategoryEditScreenNavigationProp>();
  const route = useRoute<CategoryEditScreenRouteProp>();
  const { categoryId } = route.params || {};
  
  const { createCategory, updateCategory, getCategoryById } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!categoryId;

  useEffect(() => {
    if (isEditMode && categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      let category = getCategoryById(categoryId!);
      
      if (!category) {
        // Fetch từ API nếu không có trong context
        const categories = await categoriesService.getCategories();
        category = categories.find((c) => c.id === categoryId);
      }
      
      if (category) {
        setName(category.name);
        setColor(category.color);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể tải danh mục');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên danh mục không được để trống');
      return;
    }

    if (name.trim().length > 100) {
      Alert.alert('Lỗi', 'Tên danh mục không được vượt quá 100 ký tự');
      return;
    }

    if (!validation.validateCategoryColor(color)) {
      Alert.alert('Lỗi', 'Màu sắc không hợp lệ');
      return;
    }

    try {
      setSaving(true);
      
      if (isEditMode && categoryId) {
        const updateData: UpdateCategoryDto = {
          name: name.trim(),
          color: color,
        };
        await updateCategory(categoryId, updateData);
      } else {
        const createData: CreateCategoryDto = {
          name: name.trim(),
          color: color,
        };
        await createCategory(createData);
      }
      
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Không thể lưu danh mục');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (name.trim()) {
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên danh mục *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên danh mục (1-100 ký tự)"
              value={name}
              onChangeText={setName}
              maxLength={100}
              editable={!saving}
            />
            <Text style={styles.charCount}>
              {name.length}/100
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Màu sắc</Text>
            <View style={styles.colorPicker}>
              {DEFAULT_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorOption,
                    { backgroundColor: col },
                    color === col && styles.selectedColor,
                  ]}
                  onPress={() => setColor(col)}
                >
                  {color === col && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.currentColorContainer}>
              <View style={[styles.currentColorBadge, { backgroundColor: color }]} />
              <TextInput
                style={styles.colorInput}
                placeholder="#3498db"
                value={color}
                onChangeText={setColor}
                editable={!saving}
                maxLength={7}
              />
            </View>
          </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  currentColorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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

