import { gatewayApi } from '../../../shared/services/api';

export const profileService = {
  updateProfile: async (userData) => {
    const response = await gatewayApi.put('/user/api/auth/update-profile', userData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await gatewayApi.put('/user/api/auth/change-password', passwordData);
    return response.data;
  },
  deleteAccount: async (userId) => {
    const response = await gatewayApi.delete(`/user/users/${userId}`);
    return response.data;
  },
};

