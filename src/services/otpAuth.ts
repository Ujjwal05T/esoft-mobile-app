// OTP Authentication Functions

import { getAuthToken, setAuthToken, setStoredUser, removeAuthToken } from './api';

const API_BASE_URL = 'http://192.168.1.8:5196/api';

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  expiresAt?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    phoneNumber: string;
    role: 'owner' | 'staff';
    workshopName?: string;
    city?: string;
  };
}

// Send OTP to mobile number
export async function sendOtp(phoneNumber: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send OTP',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// Verify OTP and login
export async function verifyOtp(phoneNumber: string, otp: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Invalid OTP',
      };
    }

    // If login successful, store token and user info
    if (data.token && data.user) {
      await setAuthToken(data.token);
      await setStoredUser(data.user);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
}

// Logout - navigation handled by the screen/navigator
export async function logout() {
  await removeAuthToken();
}
