import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Todo } from '../types/todo.types';

interface TodoCardProps {
  todo: Todo;
  onPress: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '#ff3b30';
    case 'high':
      return '#ff9500';
    case 'medium':
      return '#ffcc00';
    case 'low':
      return '#34c759';
    default:
      return '#8e8e93';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Chờ';
    case 'in_progress':
      return 'Đang làm';
    case 'completed':
      return 'Hoàn thành';
    default:
      return status;
  }
};

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onPress }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.is_completed;
  const priorityColor = getPriorityColor(todo.priority);
  const progress =
    todo.subtasks && todo.subtasks.length > 0
      ? todo.subtasks.filter((item) => item.is_completed).length / todo.subtasks.length
      : todo.is_completed
      ? 1
      : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {todo.is_completed && <Text style={styles.checkIcon}>✓</Text>}
          <Text
            style={[styles.title, todo.is_completed && styles.completedTitle]}
            numberOfLines={2}
          >
            {todo.title}
          </Text>
        </View>
        {todo.is_favorite && <Text style={styles.favoriteIcon}>⭐</Text>}
      </View>

      {todo.description && (
        <Text style={styles.description} numberOfLines={2}>
          {todo.description}
        </Text>
      )}

      <View style={styles.badgesRow}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {todo.priority === 'urgent'
              ? 'Khẩn'
              : todo.priority === 'high'
              ? 'Cao'
              : todo.priority === 'medium'
              ? 'Trung bình'
              : 'Thấp'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: '#007AFF20' }]}>
          <Text style={styles.statusText}>{getStatusText(todo.status)}</Text>
        </View>
      </View>

      {todo.due_date && (
        <View style={styles.dueDateRow}>
          <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
            📅 {formatDate(todo.due_date)}
            {isOverdue && ' (Quá hạn)'}
          </Text>
        </View>
      )}

      {todo.subtasks && todo.subtasks.length > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: priorityColor }]}
            />
          </View>
          <Text style={styles.progressText}>
            {todo.subtasks.filter((item) => item.is_completed).length}/{todo.subtasks.length}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        {todo.category && (
          <View style={[styles.categoryBadge, { backgroundColor: todo.category.color + '20' }]}>
            <View style={[styles.categoryDot, { backgroundColor: todo.category.color }]} />
            <Text style={styles.categoryText}>{todo.category.name}</Text>
          </View>
        )}

        {todo.tags && todo.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {todo.tags.slice(0, 2).map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>#{tag.name}</Text>
              </View>
            ))}
            {todo.tags.length > 2 && <Text style={styles.moreTags}>+{todo.tags.length - 2}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    fontSize: 18,
    color: '#34c759',
    marginRight: 8,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  dueDateRow: {
    marginBottom: 8,
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  moreTags: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
});

