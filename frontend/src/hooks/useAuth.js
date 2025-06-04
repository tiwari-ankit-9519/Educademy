import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectRegistrationStep,
  selectResetPasswordStep,
  selectProfileLoading,
  selectImageUploadLoading,
  selectDeactivatedUserData,
  selectNeedsReactivation,
  selectReactivationLoading,
  selectReactivationStatus,
  selectReactivationStatusLoading,
  selectReactivationRequestData,
  registerUser,
  verifyOTP,
  loginUser,
  requestAccountReactivation,
  checkReactivationStatus,
  requestPasswordReset,
  resetPassword,
  exchangeAuthCode,
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  removeProfileImage,
  logoutUser,
  clearError,
  clearAuthState,
  setRegistrationStep,
  setResetPasswordStep,
  updateUserData,
  clearDeactivatedUserData,
  setDeactivatedUserData,
  clearReactivationStatus,
  setReactivationRequestData,
} from "@/features/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();

  const authState = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const registrationStep = useSelector(selectRegistrationStep);
  const resetPasswordStep = useSelector(selectResetPasswordStep);
  const profileLoading = useSelector(selectProfileLoading);
  const imageUploadLoading = useSelector(selectImageUploadLoading);
  const deactivatedUserData = useSelector(selectDeactivatedUserData);
  const needsReactivation = useSelector(selectNeedsReactivation);
  const reactivationLoading = useSelector(selectReactivationLoading);
  const reactivationStatus = useSelector(selectReactivationStatus);
  const reactivationStatusLoading = useSelector(
    selectReactivationStatusLoading
  );
  const reactivationRequestData = useSelector(selectReactivationRequestData);

  const register = useCallback(
    (userData) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  const verifyOtp = useCallback(
    (otpData) => {
      return dispatch(verifyOTP(otpData));
    },
    [dispatch]
  );

  const login = useCallback(
    (credentials) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  const requestReactivation = useCallback(
    (reactivationData) => {
      return dispatch(requestAccountReactivation(reactivationData));
    },
    [dispatch]
  );

  const checkReactivationRequestStatus = useCallback(
    (userId) => {
      return dispatch(checkReactivationStatus(userId));
    },
    [dispatch]
  );

  const requestReset = useCallback(
    (email) => {
      return dispatch(requestPasswordReset(email));
    },
    [dispatch]
  );

  const resetPass = useCallback(
    (resetData) => {
      return dispatch(resetPassword(resetData));
    },
    [dispatch]
  );

  const exchangeCode = useCallback(
    (codeData) => {
      return dispatch(exchangeAuthCode(codeData));
    },
    [dispatch]
  );

  const getProfile = useCallback(() => {
    return dispatch(getUserProfile());
  }, [dispatch]);

  const updateProfile = useCallback(
    (profileData) => {
      return dispatch(updateUserProfile(profileData));
    },
    [dispatch]
  );

  const uploadProfileImage = useCallback(
    (imageData) => {
      return dispatch(updateProfileImage(imageData));
    },
    [dispatch]
  );

  const deleteProfileImage = useCallback(() => {
    return dispatch(removeProfileImage());
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearAuthState = useCallback(() => {
    dispatch(clearAuthState());
  }, [dispatch]);

  const handleSetRegistrationStep = useCallback(
    (step) => {
      dispatch(setRegistrationStep(step));
    },
    [dispatch]
  );

  const handleSetResetPasswordStep = useCallback(
    (step) => {
      dispatch(setResetPasswordStep(step));
    },
    [dispatch]
  );

  const handleUpdateUserData = useCallback(
    (userData) => {
      dispatch(updateUserData(userData));
    },
    [dispatch]
  );

  const handleClearDeactivatedUserData = useCallback(() => {
    dispatch(clearDeactivatedUserData());
  }, [dispatch]);

  const handleSetDeactivatedUserData = useCallback(
    (userData) => {
      dispatch(setDeactivatedUserData(userData));
    },
    [dispatch]
  );

  const handleClearReactivationStatus = useCallback(() => {
    dispatch(clearReactivationStatus());
  }, [dispatch]);

  const handleSetReactivationRequestData = useCallback(
    (requestData) => {
      dispatch(setReactivationRequestData(requestData));
    },
    [dispatch]
  );

  const initiateGoogleAuth = useCallback(() => {
    const authUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    }/auth/google`;
    window.location.href = authUrl;
  }, []);

  const initiateGitHubAuth = useCallback(() => {
    const authUrl = `${
      import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    }/auth/github`;
    window.location.href = authUrl;
  }, []);

  const hasRole = useCallback(
    (role) => {
      return user?.role === role;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission) => {
      return user?.permissions?.includes(permission) || false;
    },
    [user]
  );

  const isEmailVerified = useCallback(() => {
    return user?.isVerified || false;
  }, [user]);

  const isAccountActive = useCallback(() => {
    return user?.isActive || false;
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user?.firstName && !user?.lastName) return "U";
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [user]);

  const getDisplayName = useCallback(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.email?.split("@")[0] || "User";
  }, [user]);

  const getFullUserData = useCallback(() => {
    if (!user) return null;
    return {
      ...user,
      displayName: getDisplayName(),
      initials: getInitials(),
      isEmailVerified: isEmailVerified(),
      isAccountActive: isAccountActive(),
    };
  }, [user, getDisplayName, getInitials, isEmailVerified, isAccountActive]);

  const getReactivationStatusInfo = useCallback(() => {
    if (!reactivationStatus) return null;

    return {
      ...reactivationStatus,
      isApproved: reactivationStatus.status === "APPROVED",
      isRejected: reactivationStatus.status === "REJECTED",
      isPending: reactivationStatus.status === "PENDING",
      canRequestAgain: reactivationStatus.status === "REJECTED",
      statusText:
        {
          PENDING: "Under Review",
          APPROVED: "Approved",
          REJECTED: "Rejected",
        }[reactivationStatus.status] || "Unknown",
    };
  }, [reactivationStatus]);

  const hasExistingReactivationRequest = useCallback(() => {
    return !!(reactivationRequestData || deactivatedUserData?.existingRequest);
  }, [reactivationRequestData, deactivatedUserData]);

  const getExistingRequestInfo = useCallback(() => {
    const existingRequest =
      reactivationRequestData || deactivatedUserData?.existingRequest;
    if (!existingRequest) return null;

    return {
      id: existingRequest.id,
      submittedAt: existingRequest.submittedAt || existingRequest.createdAt,
      status: existingRequest.status,
      hasPendingRequest: existingRequest.status === "PENDING",
      canSubmitNew: existingRequest.status !== "PENDING",
    };
  }, [reactivationRequestData, deactivatedUserData]);

  return {
    authState,
    user,
    isAuthenticated,
    isLoading,
    error,
    registrationStep,
    resetPasswordStep,
    profileLoading,
    imageUploadLoading,
    deactivatedUserData,
    needsReactivation,
    reactivationLoading,
    reactivationStatus,
    reactivationStatusLoading,
    reactivationRequestData,
    register,
    verifyOtp,
    login,
    requestReactivation,
    checkReactivationRequestStatus,
    requestReset,
    resetPass,
    exchangeCode,
    getProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    logout,
    clearError: handleClearError,
    clearAuthState: handleClearAuthState,
    setRegistrationStep: handleSetRegistrationStep,
    setResetPasswordStep: handleSetResetPasswordStep,
    updateUserData: handleUpdateUserData,
    clearDeactivatedUserData: handleClearDeactivatedUserData,
    setDeactivatedUserData: handleSetDeactivatedUserData,
    clearReactivationStatus: handleClearReactivationStatus,
    setReactivationRequestData: handleSetReactivationRequestData,
    initiateGoogleAuth,
    initiateGitHubAuth,
    hasRole,
    hasPermission,
    isEmailVerified,
    isAccountActive,
    getInitials,
    getDisplayName,
    getFullUserData,
    getReactivationStatusInfo,
    hasExistingReactivationRequest,
    getExistingRequestInfo,
  };
};
