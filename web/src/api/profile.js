import client from './client';

export const updateProfile = (data) => client.put('/profile', data);
export const changePassword = (data) => client.put('/profile/password', data);
