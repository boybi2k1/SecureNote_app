import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useCategories } from '../context/CategoriesContext';
import { useTags } from '../context/TagsContext';
import { NoteFilters } from '../types/note.types';
import { TodoFilters } from '../types/todo.types';
import { Category } from '../types/category.types';
import { Tag } from '../types/tag.types';

interface FilterBarProps {
  filters: NoteFilters | TodoFilters;
  onFiltersChange: (filters: NoteFilters | TodoFilters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const { categories, fetchCategories } = useCategories();
  const { tags, fetchTags } = useTags();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const handleCategorySelect = (category: Category | null) => {
    onFiltersChange({
      ...filters,
      category_id: category ? category.id : undefined,
    });
    setShowCategoryModal(false);
  };

  const handleTagToggle = (tagId: number) => {
    const currentTagIds = filters.tag_ids || [];
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    
    onFiltersChange({
      ...filters,
      tag_ids: newTagIds.length > 0 ? newTagIds : undefined,
    });
  };

  const handleFavoriteToggle = () => {
    onFiltersChange({
      ...filters,
      favorite: filters.favorite === true ? undefined : true,
    });
  };

  const handleStatusToggle = (status?: 'pending' | 'in_progress' | 'completed') => {
    const todoFilters = filters as TodoFilters;
    onFiltersChange({
      ...filters,
      status: todoFilters.status === status ? undefined : status,
    } as any);
  };

  const handlePriorityToggle = (priority?: 'low' | 'medium' | 'high' | 'urgent') => {
    const todoFilters = filters as TodoFilters;
    onFiltersChange({
      ...filters,
      priority: todoFilters.priority === priority ? undefined : priority,
    } as any);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const selectedCategory = categories.find((c) => c.id === filters.category_id);
  const selectedTagIds = filters.tag_ids || [];
  const todoFilters = filters as TodoFilters;
  const hasActiveFilters = 
    filters.category_id !== undefined ||
    (filters.tag_ids && filters.tag_ids.length > 0) ||
    filters.favorite === true ||
    filters.search !== undefined ||
    todoFilters.status !== undefined ||
    todoFilters.priority !== undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Filter */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.category_id !== undefined && styles.filterButtonActive,
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filters.category_id !== undefined && styles.filterButtonTextActive,
            ]}
          >
            {selectedCategory ? selectedCategory.name : 'Danh mục'}
          </Text>
        </TouchableOpacity>

        {/* Tags Filter */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedTagIds.length > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowTagsModal(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedTagIds.length > 0 && styles.filterButtonTextActive,
            ]}
          >
            {selectedTagIds.length > 0
              ? `Thẻ (${selectedTagIds.length})`
              : 'Thẻ'}
          </Text>
        </TouchableOpacity>

        {/* Favorite Toggle */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.favorite === true && styles.filterButtonActive,
          ]}
          onPress={handleFavoriteToggle}
        >
          <Text
            style={[
              styles.filterButtonText,
              filters.favorite === true && styles.filterButtonTextActive,
            ]}
          >
            {filters.favorite === true ? '⭐ Yêu thích' : '☆ Yêu thích'}
          </Text>
        </TouchableOpacity>

        {/* Status Filter (for Todos) */}
        {'status' in filters && (
          <>
            <TouchableOpacity
              style={[
                styles.filterButton,
                todoFilters.status === 'pending' && styles.filterButtonActive,
              ]}
              onPress={() => handleStatusToggle('pending')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  todoFilters.status === 'pending' && styles.filterButtonTextActive,
                ]}
              >
                Chờ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                todoFilters.status === 'in_progress' && styles.filterButtonActive,
              ]}
              onPress={() => handleStatusToggle('in_progress')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  todoFilters.status === 'in_progress' && styles.filterButtonTextActive,
                ]}
              >
                Đang làm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                todoFilters.status === 'completed' && styles.filterButtonActive,
              ]}
              onPress={() => handleStatusToggle('completed')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  todoFilters.status === 'completed' && styles.filterButtonTextActive,
                ]}
              >
                Hoàn thành
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Priority Filter (for Todos) */}
        {'priority' in filters && (
          <>
            <TouchableOpacity
              style={[
                styles.filterButton,
                todoFilters.priority === 'urgent' && styles.filterButtonActive,
              ]}
              onPress={() => handlePriorityToggle('urgent')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  todoFilters.priority === 'urgent' && styles.filterButtonTextActive,
                ]}
              >
                Khẩn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                todoFilters.priority === 'high' && styles.filterButtonActive,
              ]}
              onPress={() => handlePriorityToggle('high')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  todoFilters.priority === 'high' && styles.filterButtonTextActive,
                ]}
              >
                Cao
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null, name: 'Tất cả' } as any, ...categories]}
              keyExtractor={(item) => (item.id ? item.id.toString() : 'all')}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    filters.category_id === item.id && styles.modalItemActive,
                  ]}
                  onPress={() => handleCategorySelect(item.id ? item : null)}
                >
                  {item.id && (
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.modalItemText,
                      filters.category_id === item.id && styles.modalItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Tags Modal */}
      <Modal
        visible={showTagsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTagsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thẻ</Text>
              <TouchableOpacity onPress={() => setShowTagsModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={tags}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedTagIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      isSelected && styles.modalItemActive,
                    ]}
                    onPress={() => handleTagToggle(item.id)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextActive,
                      ]}
                    >
                      {isSelected ? '✓ ' : ''}#{item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Chưa có thẻ nào</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemActive: {
    backgroundColor: '#e3f2fd',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

