import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface ReminderPickerProps {
  reminderAt: Date | null;
  onReminderChange: (date: Date | null) => void;
}

export const ReminderPicker: React.FC<ReminderPickerProps> = ({
  reminderAt,
  onReminderChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    reminderAt || new Date(Date.now() + 60 * 60 * 1000) // Default: 1 hour from now
  );

  // Sync tempDate when reminderAt changes from outside
  useEffect(() => {
    if (reminderAt) {
      setTempDate(reminderAt);
    } else {
      setTempDate(new Date(Date.now() + 60 * 60 * 1000));
    }
  }, [reminderAt]);

  // Open Android date picker using API
  const openAndroidDatePicker = () => {
    try {
      DateTimePickerAndroid.open({
        value: tempDate,
        mode: 'date',
        display: 'default',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            // After date is selected, open time picker
            const newDate = selectedDate;
            DateTimePickerAndroid.open({
              value: tempDate,
              mode: 'time',
              is24Hour: true,
              display: 'default',
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type === 'set' && selectedTime) {
                  // Combine date and time
                  const finalDate = new Date(newDate);
                  finalDate.setHours(selectedTime.getHours());
                  finalDate.setMinutes(selectedTime.getMinutes());
                  finalDate.setSeconds(0);
                  onReminderChange(finalDate);
                }
              },
            });
          }
        },
      });
    } catch (error) {
      console.error('Error opening Android date picker:', error);
    }
  };

  // Handle iOS date picker (just update temp date)
  const handleIOSDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirm = () => {
    onReminderChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleRemove = () => {
    onReminderChange(null);
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return 'Không có';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ nữa`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút nữa`;
    } else if (minutes > 0) {
      return `${minutes} phút nữa`;
    } else {
      return 'Đã qua';
    }
  };

  const formatFullDateTime = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, reminderAt && styles.buttonActive]}
          onPress={() => {
            if (Platform.OS === 'android') {
              openAndroidDatePicker();
            } else {
              setShowPicker(true);
            }
          }}
        >
          <Text style={[styles.buttonText, reminderAt && styles.buttonTextActive]}>
            {reminderAt ? '📅 ' + formatFullDateTime(reminderAt) : '📅 Đặt nhắc nhở'}
          </Text>
        </TouchableOpacity>
        {reminderAt && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {reminderAt && (
        <Text style={styles.hintText}>{formatDateTime(reminderAt)}</Text>
      )}


      {Platform.OS === 'ios' && showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.modalButton}>Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Chọn thời gian nhắc nhở</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={[styles.modalButton, styles.modalButtonConfirm]}>
                    Xác nhận
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={handleIOSDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF20',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
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
  modalButton: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 8,
  },
  modalButtonConfirm: {
    color: '#007AFF',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});
