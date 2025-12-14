import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTags } from '../context/TagsContext';
import { Tag } from '../types/tag.types';

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ selectedTags, onTagsChange }) => {
  const { tags, fetchTags, createTag } = useTags();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (inputValue.trim().length > 0) {
      const filtered = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedTags.some((st) => st.id === tag.id)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, tags, selectedTags]);

  const handleAddTag = async (tagName: string) => {
    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    // Kiểm tra xem tag đã được chọn chưa
    const existingSelected = selectedTags.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingSelected) {
      setInputValue('');
      return;
    }

    // Tìm tag trong danh sách tags hiện có
    const existingTag = tags.find((t) => t.name.toLowerCase() === trimmedName.toLowerCase());

    if (existingTag) {
      // Sử dụng tag đã tồn tại
      onTagsChange([...selectedTags, existingTag]);
    } else {
      // Tạo tag mới
      try {
        const newTag = await createTag({ name: trimmedName });
        onTagsChange([...selectedTags, newTag]);
      } catch (error) {
        console.error('Error creating tag:', error);
      }
    }

    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleSelectSuggestion = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleAddTag(inputValue);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Thẻ</Text>

      {selectedTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedTagsContainer}
        >
          {selectedTags.map((tag) => (
            <View key={tag.id} style={styles.tagChip}>
              <Text style={styles.tagChipText}>#{tag.name}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveTag(tag.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên thẻ và nhấn Enter hoặc nhấn nút +"
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleInputSubmit}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {inputValue.trim().length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleInputSubmit}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionText}>#{item.name}</Text>
              </TouchableOpacity>
            )}
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedTagsContainer: {
    marginBottom: 8,
    maxHeight: 40,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});

