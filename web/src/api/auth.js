import client from './client';

export const registerShop = (data) => client.post('/auth/register', data);
export const verifySignupOtp = (data) => client.post('/auth/verify-otp', data);
export const forgotPassword = (identifier) => client.post('/auth/forgot-password', { identifier });
export const resetPassword = (data) => client.post('/auth/reset-password', data);
export const sendLoginOtp = (mobile) => client.post('/auth/login-otp/send', { mobile });
export const verifyLoginOtp = (data) => client.post('/auth/login-otp/verify', data);