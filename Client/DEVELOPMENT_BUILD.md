# Hướng dẫn tạo Development Build để có Notifications đầy đủ

## Tại sao cần Development Build?

Expo Go có giới hạn với notifications. Để có notifications đầy đủ (hoạt động khi app đóng), bạn cần tạo Development Build.

## Cài đặt

### 1. Cài đặt expo-dev-client

```bash
cd Client
npm install
```

### 2. Tạo Development Build cho Android

```bash
# Tạo native code
npx expo prebuild

# Build và chạy trên Android
npx expo run:android
```

### 3. Tạo Development Build cho iOS (chỉ trên macOS)

```bash
# Tạo native code
npx expo prebuild

# Build và chạy trên iOS
npx expo run:ios
```

## Sau khi build xong

1. App sẽ được cài đặt trên thiết bị/emulator
2. Notifications sẽ hoạt động đầy đủ (kể cả khi app đóng)
3. Bạn vẫn có thể dùng `npx expo start` để development như bình thường

## Lưu ý

- Development Build lớn hơn Expo Go (~50-100MB)
- Cần build lại khi thay đổi native code hoặc plugins
- JavaScript code vẫn hot-reload bình thường

## Troubleshooting

### Lỗi build Android
```bash
# Clear cache
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Lỗi build iOS
```bash
# Clear cache
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

## Alternative: Sử dụng EAS Build (Cloud Build)

Nếu không muốn build local:

```bash
# Cài EAS CLI
npm install -g eas-cli

# Login
eas login

# Build cho Android
eas build --platform android --profile development

# Build cho iOS
eas build --platform ios --profile development
```

Sau đó tải file APK/IPA về và cài đặt.

