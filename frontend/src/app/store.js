import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import authReducer from "@/features/common/authSlice";
import adminAnalyticsReducer from "@/features/adminSlice/adminAnalytics";
import adminUserReducer from "@/features/adminSlice/adminUser";
import adminSystemReducer from "@/features/adminSlice/adminSystem";
import adminModerationReducer from "@/features/adminSlice/adminModeration";
import adminCourseReducer from "@/features/adminSlice/adminCourse";
import adminPaymentReducer from "../features/adminSlice/adminPayment";
import ticketSupportReducer from "@/features/common/ticketSlice";
import notificationReducer from "@/features/common/notificationSlice";
import verificationReducer from "@/features/instructor/verificationSlice";
import couponReducer from "@/features/instructor/couponSlice";
import instructorCourseReducer from "@/features/instructor/instructorCourseSlice";
// import earningReducer from "@/features/instructor/earningSlice";
import instructorCommunityReducer from "@/features/instructor/communitySlice";
import instructorStudentReducer from "@/features/instructor/instructorStudentSlice";
import contentManagementReducer from "@/features/instructor/contentManagementSlice";

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
  adminPayment: adminPaymentReducer,
  ticketSupport: ticketSupportReducer,
  notification: notificationReducer,
  verification: verificationReducer,
  coupon: couponReducer,
  instructorCourse: instructorCourseReducer,
  // earning: earningReducer,
  instructorCommunity: instructorCommunityReducer,
  instructorStudent: instructorStudentReducer,
  contentManagement: contentManagementReducer,
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
