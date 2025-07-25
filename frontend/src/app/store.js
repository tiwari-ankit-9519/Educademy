import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import authReducer from "@/features/authSlice";
import adminAnalyticsReducer from "@/features/adminSlice/adminAnalytics";
import adminUserReducer from "@/features/adminSlice/adminUser";
import adminSystemReducer from "@/features/adminSlice/adminSystem";
import adminModerationReducer from "@/features/adminSlice/adminModeration";
import adminCourseReducer from "@/features/adminSlice/adminCourse";

const authPersistConfig = {
  key: "auth",
  storage,
  blacklist: ["error", "loading", "otpStatus"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  adminAnalytics: adminAnalyticsReducer,
  adminUser: adminUserReducer,
  adminSystem: adminSystemReducer,
  adminModeration: adminModerationReducer,
  adminCourse: adminCourseReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
