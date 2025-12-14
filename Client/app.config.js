export default {
  expo: {
    name: "Secure Notes",
    slug: "secure-notes-app",
    version: "1.0.0",
    extra: {
      // IP máy tính của bạn
      // Có thể override bằng environment variables
      apiUrl: process.env.API_URL || "http://192.130.38.105:8000",
      apiBaseUrl: process.env.API_BASE_URL || "http://192.130.38.105:8000/api",
    },
  },
};

