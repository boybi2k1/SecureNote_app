import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { shareService } from '../services/shareService';
import { UserSearchResult } from '../types/share.types';

interface UserSearchInputProps {
  onUserSelect: (username: string) => void;
  excludeUsers?: string[];
  placeholder?: string;
}

export const UserSearchInput: React.FC<UserSearchInputProps> = ({
  onUserSelect,
  excludeUsers = [],
  placeholder = 'Tìm kiếm user (tối thiểu 3 ký tự)...',
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only search if query is at least 3 characters
    if (query.trim().length >= 3) {
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await shareService.searchUsers(query.trim());
          // Filter out excluded users
          const filteredResults = results.filter(
            (user) => !excludeUsers.includes(user.username)
          );
          setUsers(filteredResults);
          setShowSuggestions(filteredResults.length > 0);
        } catch (err: any) {
          console.error('Search users error:', err);
          setUsers([]);
          setShowSuggestions(false);
        } finally {
          setLoading(false);
        }
      }, 400);
    } else {
      setUsers([]);
      setShowSuggestions(false);
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, excludeUsers]);

  const handleSelectUser = (username: string) => {
    onUserSelect(username);
    setQuery('');
    setShowSuggestions(false);
    setUsers([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => {
            if (users.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>

      {showSuggestions && users.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={users}
            keyExtractor={(item) => item.username}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectUser(item.username)}
              >
                <Text style={styles.suggestionText}>@{item.username}</Text>
              </TouchableOpacity>
            )}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {query.trim().length > 0 && query.trim().length < 3 && (
        <Text style={styles.hintText}>Nhập ít nhất 3 ký tự để tìm kiếm</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    padding: 8,
  },
  suggestionsContainer: {
    maxHeight: 200,
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
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
});

