import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { statisticsService } from '../../services/statisticsService';
import { Statistics } from '../../types/statistics.types';
import { parseServerDateTime } from '../../utils/dateUtils';

type StatisticsScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Statistics'>;

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [])
  );

  const loadStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await statisticsService.getDashboardStatistics();
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = parseServerDateTime(dateString + 'T00:00:00');
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getDayName = (dateString: string): string => {
    const date = parseServerDateTime(dateString + 'T00:00:00');
    if (!date) return '';
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  if (loading && !statistics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu thống kê</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadStatistics(true)} />
      }
    >
      {/* Overview Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Tổng quan</Text>
        <View style={styles.cardRow}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statValue}>{statistics.total_notes}</Text>
            <Text style={styles.statLabel}>Ghi chú</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statValue}>{statistics.total_todos}</Text>
            <Text style={styles.statLabel}>Todos</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statValue}>{statistics.completed_todos}</Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
          <View style={[styles.statCard, styles.infoCard]}>
            <Text style={styles.statValue}>{statistics.completion_rate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Tỷ lệ hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Notes Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Thống kê Ghi chú</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.total_notes_this_week}</Text>
            <Text style={styles.statItemLabel}>Tuần này</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.total_notes_this_month}</Text>
            <Text style={styles.statItemLabel}>Tháng này</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.favorite_notes}</Text>
            <Text style={styles.statItemLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.shared_notes}</Text>
            <Text style={styles.statItemLabel}>Đã chia sẻ</Text>
          </View>
        </View>
      </View>

      {/* Todos Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Thống kê Todos</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.pending_todos}</Text>
            <Text style={styles.statItemLabel}>Chờ xử lý</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.in_progress_todos}</Text>
            <Text style={styles.statItemLabel}>Đang làm</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.completed_todos_this_week}</Text>
            <Text style={styles.statItemLabel}>Hoàn thành tuần này</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemValue}>{statistics.completed_todos_this_month}</Text>
            <Text style={styles.statItemLabel}>Hoàn thành tháng này</Text>
          </View>
        </View>
      </View>

      {/* Priority Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Phân bổ Độ ưu tiên</Text>
        <View style={styles.priorityContainer}>
          <View style={styles.priorityItem}>
            <View style={[styles.priorityBar, { backgroundColor: '#4CAF50', width: `${(statistics.todos_by_priority.low / statistics.total_todos * 100) || 0}%` }]} />
            <Text style={styles.priorityLabel}>Thấp: {statistics.todos_by_priority.low}</Text>
          </View>
          <View style={styles.priorityItem}>
            <View style={[styles.priorityBar, { backgroundColor: '#FF9800', width: `${(statistics.todos_by_priority.medium / statistics.total_todos * 100) || 0}%` }]} />
            <Text style={styles.priorityLabel}>Trung bình: {statistics.todos_by_priority.medium}</Text>
          </View>
          <View style={styles.priorityItem}>
            <View style={[styles.priorityBar, { backgroundColor: '#F44336', width: `${(statistics.todos_by_priority.high / statistics.total_todos * 100) || 0}%` }]} />
            <Text style={styles.priorityLabel}>Cao: {statistics.todos_by_priority.high}</Text>
          </View>
          <View style={styles.priorityItem}>
            <View style={[styles.priorityBar, { backgroundColor: '#9C27B0', width: `${(statistics.todos_by_priority.urgent / statistics.total_todos * 100) || 0}%` }]} />
            <Text style={styles.priorityLabel}>Khẩn: {statistics.todos_by_priority.urgent}</Text>
          </View>
        </View>
      </View>

      {/* Activity Chart - Notes Created */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Hoạt động 7 ngày qua - Ghi chú</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {statistics.notes_created_last_7_days.map((item, index) => {
              const maxCount = Math.max(...statistics.notes_created_last_7_days.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarWrapper}>
                    <View style={[styles.chartBar, { height: `${height}%`, backgroundColor: '#2196F3' }]} />
                    <Text style={styles.chartBarValue}>{item.count}</Text>
                  </View>
                  <Text style={styles.chartBarLabel}>{getDayName(item.date)}</Text>
                  <Text style={styles.chartBarDate}>{formatDate(item.date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Activity Chart - Todos Completed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Hoạt động 7 ngày qua - Todos</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {statistics.todos_completed_last_7_days.map((item, index) => {
              const maxCount = Math.max(...statistics.todos_completed_last_7_days.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarWrapper}>
                    <View style={[styles.chartBar, { height: `${height}%`, backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.chartBarValue}>{item.count}</Text>
                  </View>
                  <Text style={styles.chartBarLabel}>{getDayName(item.date)}</Text>
                  <Text style={styles.chartBarDate}>{formatDate(item.date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Category Distribution */}
      {(Object.keys(statistics.notes_by_category).length > 0 || Object.keys(statistics.todos_by_category).length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Phân bổ theo Danh mục</Text>
          {Object.keys(statistics.notes_by_category).length > 0 && (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Ghi chú:</Text>
              {Object.entries(statistics.notes_by_category).map(([category, count]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
          {Object.keys(statistics.todos_by_category).length > 0 && (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Todos:</Text>
              {Object.entries(statistics.todos_by_category).map(([category, count]) => (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 Hoạt động gần đây (24h)</Text>
        <View style={styles.recentActivityContainer}>
          <View style={styles.recentActivityItem}>
            <Text style={styles.recentActivityValue}>{statistics.recent_notes_count}</Text>
            <Text style={styles.recentActivityLabel}>Ghi chú mới</Text>
          </View>
          <View style={styles.recentActivityItem}>
            <Text style={styles.recentActivityValue}>{statistics.recent_todos_count}</Text>
            <Text style={styles.recentActivityLabel}>Todos mới</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#E3F2FD',
  },
  successCard: {
    backgroundColor: '#E8F5E9',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
  },
  infoCard: {
    backgroundColor: '#E1F5FE',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statItemLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  priorityContainer: {
    gap: 12,
  },
  priorityItem: {
    marginBottom: 8,
  },
  priorityBar: {
    height: 24,
    borderRadius: 4,
    marginBottom: 4,
    minWidth: 4,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#333',
  },
  chartContainer: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarWrapper: {
    height: 150,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarValue: {
    position: 'absolute',
    top: -20,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  chartBarDate: {
    fontSize: 10,
    color: '#999',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  recentActivityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recentActivityItem: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  recentActivityValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  recentActivityLabel: {
    fontSize: 12,
    color: '#666',
  },
});


