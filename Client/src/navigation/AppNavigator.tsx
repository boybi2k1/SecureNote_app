import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NotesListScreen, AppStackParamList } from '../screens/Notes/NotesListScreen';
import { NoteDetailScreen } from '../screens/Notes/NoteDetailScreen';
import { NoteEditScreen } from '../screens/Notes/NoteEditScreen';
import { TodosListScreen } from '../screens/Todos/TodosListScreen';
import { TodoDetailScreen } from '../screens/Todos/TodoDetailScreen';
import { TodoEditScreen } from '../screens/Todos/TodoEditScreen';
import { TrashScreen } from '../screens/Notes/TrashScreen';
import { ShareNoteScreen } from '../screens/Notes/ShareNoteScreen';
import { SharedNotesScreen } from '../screens/Notes/SharedNotesScreen';
import { CategoriesScreen } from '../screens/Categories/CategoriesScreen';
import { CategoryEditScreen } from '../screens/Categories/CategoryEditScreen';
import { CalendarScreen } from '../screens/Calendar/CalendarScreen';
import { StatisticsScreen } from '../screens/Statistics/StatisticsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { ProfileScreen } from '../screens/Settings/ProfileScreen';
import { ChangePasswordScreen } from '../screens/Settings/ChangePasswordScreen';

const Stack = createStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="NotesList" 
        component={NotesListScreen}
        options={{
          title: 'Ghi chú',
        }}
      />
      <Stack.Screen 
        name="NoteDetail" 
        component={NoteDetailScreen}
        options={{
          title: 'Chi tiết ghi chú',
        }}
      />
      <Stack.Screen 
        name="NoteEdit" 
        component={NoteEditScreen}
        options={({ route }) => ({
          title: route.params?.noteId ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú mới',
        })}
      />
      <Stack.Screen 
        name="TodosList" 
        component={TodosListScreen}
        options={{
          title: 'Todos',
        }}
      />
      <Stack.Screen 
        name="TodoDetail" 
        component={TodoDetailScreen}
        options={{
          title: 'Chi tiết todo',
        }}
      />
      <Stack.Screen 
        name="TodoEdit" 
        component={TodoEditScreen}
        options={({ route }) => ({
          title: route.params?.todoId ? 'Chỉnh sửa todo' : 'Tạo todo mới',
        })}
      />
      <Stack.Screen 
        name="CategoriesList" 
        component={CategoriesScreen}
        options={{
          title: 'Danh mục',
        }}
      />
      <Stack.Screen 
        name="CategoryEdit" 
        component={CategoryEditScreen}
        options={({ route }) => ({
          title: route.params?.categoryId ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới',
        })}
      />
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          title: 'Lịch',
        }}
      />
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{
          title: 'Thống kê',
        }}
      />
      <Stack.Screen 
        name="Trash" 
        component={TrashScreen}
        options={{
          title: 'Thùng rác',
        }}
      />
      <Stack.Screen 
        name="ShareNote" 
        component={ShareNoteScreen}
        options={{
          title: 'Chia sẻ ghi chú',
        }}
      />
      <Stack.Screen 
        name="SharedNotes" 
        component={SharedNotesScreen}
        options={{
          title: 'Chia sẻ với tôi',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Cài đặt',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Chỉnh sửa profile',
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{
          title: 'Đổi mật khẩu',
        }}
      />
    </Stack.Navigator>
  );
};

