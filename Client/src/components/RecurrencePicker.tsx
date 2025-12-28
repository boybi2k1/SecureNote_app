import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null;

interface RecurrencePickerProps {
  pattern: RecurrencePattern;
  interval: number;
  endDate: Date | null;
  endCount: number | null;
  endType: 'never' | 'date' | 'count';
  onPatternChange: (pattern: RecurrencePattern) => void;
  onIntervalChange: (interval: number) => void;
  onEndDateChange: (date: Date | null) => void;
  onEndCountChange: (count: number | null) => void;
  onEndTypeChange: (type: 'never' | 'date' | 'count') => void;
}

export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({
  pattern,
  interval,
  endDate,
  endCount,
  endType,
  onPatternChange,
  onIntervalChange,
  onEndDateChange,
  onEndCountChange,
  onEndTypeChange,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const patternLabels: Record<NonNullable<RecurrencePattern>, string> = {
    daily: 'Hàng ngày',
    weekly: 'Hàng tuần',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
    custom: 'Tùy chỉnh',
  };

  const getPreviewText = (): string => {
    if (!pattern) return 'Không lặp lại';
    
    const patternText = patternLabels[pattern];
    const intervalText = interval > 1 ? `Mỗi ${interval} ` : '';
    
    let preview = `${intervalText}${patternText}`;
    
    if (endType === 'date' && endDate) {
      preview += ` đến ${endDate.toLocaleDateString('vi-VN')}`;
    } else if (endType === 'count' && endCount) {
      preview += ` (${endCount} lần)`;
    }
    
    return preview;
  };

  const handlePatternSelect = (selectedPattern: RecurrencePattern) => {
    onPatternChange(selectedPattern);
    if (!selectedPattern) {
      onEndTypeChange('never');
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        onEndDateChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        onEndDateChange(selectedDate);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, pattern && styles.buttonActive]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.buttonText, pattern && styles.buttonTextActive]}>
          {pattern ? `🔄 ${getPreviewText()}` : '🔄 Không lặp lại'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lặp lại</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Pattern Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tần suất</Text>
                <TouchableOpacity
                  style={[styles.option, !pattern && styles.optionSelected]}
                  onPress={() => handlePatternSelect(null)}
                >
                  <Text style={[styles.optionText, !pattern && styles.optionTextSelected]}>
                    Không lặp lại
                  </Text>
                </TouchableOpacity>
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.option, pattern === p && styles.optionSelected]}
                    onPress={() => handlePatternSelect(p)}
                  >
                    <Text style={[styles.optionText, pattern === p && styles.optionTextSelected]}>
                      {patternLabels[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Interval */}
              {pattern && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Khoảng cách</Text>
                  <View style={styles.intervalContainer}>
                    <Text style={styles.intervalLabel}>Mỗi</Text>
                    <TextInput
                      style={styles.intervalInput}
                      value={interval.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          onIntervalChange(num);
                        }
                      }}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.intervalLabel}>
                      {pattern === 'daily' ? 'ngày' : pattern === 'weekly' ? 'tuần' : pattern === 'monthly' ? 'tháng' : 'năm'}
                    </Text>
                  </View>
                </View>
              )}

              {/* End Type */}
              {pattern && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Kết thúc</Text>
                  <TouchableOpacity
                    style={[styles.option, endType === 'never' && styles.optionSelected]}
                    onPress={() => onEndTypeChange('never')}
                  >
                    <Text style={[styles.optionText, endType === 'never' && styles.optionTextSelected]}>
                      Không bao giờ
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.option, endType === 'date' && styles.optionSelected]}
                    onPress={() => onEndTypeChange('date')}
                  >
                    <Text style={[styles.optionText, endType === 'date' && styles.optionTextSelected]}>
                      Vào ngày
                    </Text>
                  </TouchableOpacity>
                  {endType === 'date' && (
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {endDate
                          ? endDate.toLocaleDateString('vi-VN')
                          : 'Chọn ngày kết thúc'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.option, endType === 'count' && styles.optionSelected]}
                    onPress={() => onEndTypeChange('count')}
                  >
                    <Text style={[styles.optionText, endType === 'count' && styles.optionTextSelected]}>
                      Sau số lần
                    </Text>
                  </TouchableOpacity>
                  {endType === 'count' && (
                    <View style={styles.countContainer}>
                      <TextInput
                        style={styles.countInput}
                        value={endCount?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10);
                          if (!isNaN(num) && num > 0) {
                            onEndCountChange(num);
                          } else if (text === '') {
                            onEndCountChange(null);
                          }
                        }}
                        keyboardType="numeric"
                        placeholder="Số lần"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.countLabel}>lần</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Date Picker for End Date */}
              {showEndDatePicker && (
                <>
                  {Platform.OS === 'android' ? (
                    <DateTimePicker
                      value={endDate || new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={handleEndDateChange}
                    />
                  ) : (
                    <DateTimePicker
                      value={endDate || new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={handleEndDateChange}
                      style={styles.datePicker}
                    />
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.saveButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
  },
  buttonTextActive: {
    color: '#2196F3',
    fontWeight: '600',
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
    maxHeight: '80%',
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
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  option: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intervalLabel: {
    fontSize: 14,
    color: '#666',
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minWidth: 60,
    textAlign: 'center',
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minWidth: 80,
    textAlign: 'center',
  },
  countLabel: {
    fontSize: 14,
    color: '#666',
  },
  datePicker: {
    height: 200,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});





