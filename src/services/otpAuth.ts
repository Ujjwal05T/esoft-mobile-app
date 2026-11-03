// OTP Authentication Functions

import { apiRequest, setAuthToken, setStoredUser, type UserInfo } from './api';

interface VerifyOtpResponse {
  token?: string;
  user?: UserInfo;
}

// These run before there is a session, so they never send a bearer token.
function sendOtp(path: string, body: object) {
  return apiRequest<unknown>(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    { skipAuth: true, fallbackError: 'Failed to send OTP' },
  );
}

// Verifies the OTP and, on success, stores the token and user so the app is signed in.
async function verifyOtp(path: string, body: object) {
  const result = await apiRequest<VerifyOtpResponse>(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    { skipAuth: true, fallbackError: 'Invalid OTP' },
  );
  if (result.success && result.data?.token && result.data.user) {
    await setAuthToken(result.data.token);
    await setStoredUser(result.data.user);
  }
  return result;
}

// Send OTP to email
export function sendOtpByEmail(email: string) {
  return sendOtp('/auth/send-otp-email', { email });
}

// Verify email OTP and login
export function verifyOtpByEmail(email: string, otp: string) {
  return verifyOtp('/auth/verify-otp-email', { email, otp });
}

// Send OTP to phone via WhatsApp
export function sendOtpByWhatsApp(phoneNumber: string) {
  return sendOtp('/auth/send-otp', { phoneNumber });
}

// Verify phone OTP and login
export function verifyOtpByPhone(phoneNumber: string, otp: string) {
  return verifyOtp('/auth/verify-otp', { phoneNumber, otp });
}
