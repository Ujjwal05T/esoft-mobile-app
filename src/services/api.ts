import * as Keychain from 'react-native-keychain';

// API Base URL
// const API_BASE_URL = 'https://esoft.indusanalytics.co.in/api';
// export const SERVER_ORIGIN = 'https://esoft.indusanalytics.co.in';
const API_BASE_URL = 'http://192.168.137.1:5196/api';
export const SERVER_ORIGIN = 'http://192.168.137.1:5196';

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

const TOKEN_SERVICE = 'auth_token';
const USER_SERVICE = 'auth_user';

// Get stored auth token
export async function getAuthToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
  return credentials ? credentials.password : null;
}

// Set auth token
export async function setAuthToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('token', token, { service: TOKEN_SERVICE });
}

// Remove auth token (logout)
export async function removeAuthToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
  await Keychain.resetGenericPassword({ service: USER_SERVICE });
}

// Get stored user info
export async function getStoredUser(): Promise<UserInfo | null> {
  const credentials = await Keychain.getGenericPassword({ service: USER_SERVICE });
  if (!credentials) return null;
  try {
    return JSON.parse(credentials.password);
  } catch {
    return null;
  }
}

// Set user info
export async function setStoredUser(user: UserInfo): Promise<void> {
  await Keychain.setGenericPassword('user', JSON.stringify(user), { service: USER_SERVICE });
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  return !!(await getAuthToken());
}

// User info interface
export interface UserInfo {
  id: number;
  name: string;
  email?: string;
  phoneNumber: string;
  role: 'owner' | 'staff';
  workshopName?: string;
  city?: string;
  avatar?: string;
}

// React Native file object (replaces browser File/Blob)
export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

// ==========================================
// GENERIC API REQUEST HANDLER
// ==========================================

// Generic API request handler with automatic auth token
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear token
      if (response.status === 401) {
        await removeAuthToken();
      }
      return {
        success: false,
        error: data.message || data.errors?.[0] || 'An error occurred',
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// AUTHENTICATION API
// ==========================================

// Login request interface
export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

// Login response interface
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  expiresAt?: string;
  user?: UserInfo;
}

// Login (generic - auto-detect owner/staff)
export async function login(phoneNumber: string, password: string) {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, password }),
  });

  if (response.success && response.data?.token && response.data?.user) {
    await setAuthToken(response.data.token);
    await setStoredUser(response.data.user);
  }

  return response;
}

// Login as owner
export async function loginOwner(phoneNumber: string, password: string) {
  const response = await apiRequest<LoginResponse>('/auth/login/owner', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, password }),
  });

  if (response.success && response.data?.token && response.data?.user) {
    await setAuthToken(response.data.token);
    await setStoredUser(response.data.user);
  }

  return response;
}

// Login as staff
export async function loginStaff(phoneNumber: string, password: string) {
  const response = await apiRequest<LoginResponse>('/auth/login/staff', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, password }),
  });

  if (response.success && response.data?.token && response.data?.user) {
    await setAuthToken(response.data.token);
    await setStoredUser(response.data.user);
  }

  return response;
}

// Logout
export async function logout(): Promise<void> {
  await removeAuthToken();
}

// ==========================================
// WORKSHOP REGISTRATION (New Flow)
// ==========================================

// Send OTP for phone verification
export async function sendRegistrationOtp(phoneNumber: string) {
  return apiRequest<{ success: boolean; message: string; expiresInSeconds: number }>(
    '/workshop/register/send-otp',
    {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }
  );
}

// Verify OTP during registration
export async function verifyRegistrationOtp(phoneNumber: string, otp: string) {
  return apiRequest<{ success: boolean; message: string; token: string | null }>(
    '/workshop/register/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    }
  );
}

// Submit workshop registration
export interface WorkshopRegistrationData {
  ownerName: string;
  phoneNumber: string;
  email?: string;
  aadhaarNumber: string;
  workshopName: string;
  address: string;
  landmark?: string;
  pinCode: string;
  city: string;
  gstNumber?: string;
}

export async function submitWorkshopRegistration(data: WorkshopRegistrationData) {
  return apiRequest<{ success: boolean; message: string; workshopId: number; status: string }>(
    '/workshop/register/submit',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// ==========================================
// EXISTING WORKSHOP OWNER REGISTRATION (Legacy)
// ==========================================

// Workshop Owner Registration
export interface RegisterOwnerData {
  ownerName: string;
  email: string;
  phoneNumber: string;
  password: string;
  workshopName: string;
  address: string;
  city: string;
  tradeLicense: string;
}

export interface RegisterResponse {
  message: string;
  data: {
    id: number;
    ownerName: string;
    email: string;
    registrationStatus: string;
  };
}

export async function registerOwner(data: RegisterOwnerData) {
  return apiRequest<RegisterResponse>('/workshopowner/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Email Verification
export interface VerifyEmailData {
  email: string;
  otp: string;
}

export async function verifyEmail(data: VerifyEmailData) {
  return apiRequest<{ message: string }>('/workshopowner/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Resend OTP
export async function resendOtp(email: string) {
  return apiRequest<{ message: string }>('/workshopowner/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ETNA Verification - Initiate
export interface InitiateETNAData {
  ownerEmail: string;
  etnaMemberName: string;
  etnaMemberPhone: string;
}

export async function initiateETNAVerification(data: InitiateETNAData) {
  return apiRequest<{ message: string }>('/verification/etna/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ETNA Verification - Complete
export interface CompleteETNAData {
  ownerEmail: string;
  etnaMemberName: string;
  etnaMemberPhone: string;
  etnaOtp: string;
  ownerOtp: string;
}

export interface ETNAVerificationResponse {
  success: boolean;
  message: string;
  nextStep: string;
  registrationStatus: string;
}

export async function completeETNAVerification(data: CompleteETNAData) {
  return apiRequest<ETNAVerificationResponse>('/verification/etna/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Photo Upload
export async function uploadOwnerPhoto(email: string, file: RNFile) {
  try {
    const formData = new FormData();
    formData.append('file', file as unknown as Blob);

    const response = await fetch(
      `${API_BASE_URL}/verification/photos/owner?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || data.errors?.[0] || 'Upload failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function uploadWorkshopPhoto(email: string, file: RNFile) {
  try {
    const formData = new FormData();
    formData.append('file', file as unknown as Blob);

    const response = await fetch(
      `${API_BASE_URL}/verification/photos/workshop?email=${encodeURIComponent(email)}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || data.errors?.[0] || 'Upload failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function completePhotoUpload(email: string) {
  return apiRequest<{
    success: boolean;
    message: string;
    registrationStatus: string;
    isActive: boolean;
  }>('/verification/photos/complete', {
    method: 'POST',
    body: JSON.stringify({ ownerEmail: email }),
  });
}

// Get Workshop Owner by Email
export async function getOwnerByEmail(email: string) {
  return apiRequest<{
    id: number;
    email: string;
    registrationStatus: string;
  }>(`/workshopowner/by-email/${encodeURIComponent(email)}`, {
    method: 'GET',
  });
}

// ==========================================
// WORKSHOP STAFF REGISTRATION
// ==========================================

// Get workshops by city (for dropdown)
export interface WorkshopListItem {
  id: number;
  workshopName: string;
  ownerName: string;
  address: string;
  city: string;
}

export async function getWorkshopsByCity(city: string) {
  return apiRequest<WorkshopListItem[]>(`/workshopstaff/workshops/${encodeURIComponent(city)}`, {
    method: 'GET',
  });
}

// Staff Registration
export interface StaffRegisterData {
  name: string;
  city: string;
  workshopOwnerId: number;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface StaffResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  workshopOwnerId: number;
  workshopName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  registrationStatus: string;
}

export async function registerStaff(data: StaffRegisterData) {
  return apiRequest<{ message: string; data: StaffResponse }>('/workshopstaff/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Staff Phone Verification (SMS OTP)
export async function verifyStaffPhone(phoneNumber: string, otp: string) {
  return apiRequest<{ message: string; data: StaffResponse }>('/workshopstaff/verify-phone', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp }),
  });
}

// Resend Staff OTP (SMS)
export async function resendStaffOtp(phoneNumber: string) {
  return apiRequest<{ message: string }>('/workshopstaff/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

// Check Staff Registration Status
export async function checkStaffStatus(email: string) {
  return apiRequest<StaffResponse>(`/workshopstaff/status/${encodeURIComponent(email)}`, {
    method: 'GET',
  });
}

// Get Pending Staff Requests (for owner)
export interface PendingStaffRequest {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  requestedAt: string;
}

export async function getPendingStaffRequests(workshopOwnerId: number, token: string) {
  return apiRequest<PendingStaffRequest[]>(`/workshopstaff/pending/${workshopOwnerId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Approve/Reject Staff Request (for owner)
export async function processStaffApproval(
  staffId: number,
  approve: boolean,
  token: string,
  rejectionReason?: string
) {
  return apiRequest<{ message: string; data: StaffResponse }>('/workshopstaff/approve', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      staffId,
      approve,
      rejectionReason,
    }),
  });
}

// ==========================================
// OCR SCANNING (Vehicle Plate & RC Card)
// ==========================================

export interface VehicleOcrData {
  plateNumber: string | null;
  ownerName: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  year: number | null;
  variant: string | null;
  chassisNumber: string | null;
  engineNumber: string | null;
  fuelType: string | null;
  registrationDate: string | null;
  success: boolean;
  errorMessage: string | null;
}

// Scan vehicle number plate
export async function scanVehiclePlate(base64Image: string) {
  return apiRequest<VehicleOcrData>('/ocr/scan-plate', {
    method: 'POST',
    body: JSON.stringify({ base64Image, mode: 'plate' }),
  });
}

// Scan RC (Registration Certificate) card
export async function scanRcCard(base64Image: string) {
  return apiRequest<VehicleOcrData>('/ocr/scan-rc', {
    method: 'POST',
    body: JSON.stringify({ base64Image, mode: 'rc' }),
  });
}

// Generic scan (pass mode as parameter)
export async function scanVehicleImage(base64Image: string, mode: 'plate' | 'rc') {
  return apiRequest<VehicleOcrData>('/ocr/scan', {
    method: 'POST',
    body: JSON.stringify({ base64Image, mode }),
  });
}

// ==========================================
// VEHICLE MANAGEMENT
// ==========================================

export interface CreateVehicleData {
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  variant?: string;
  chassisNumber?: string;
  specs?: string;
  registrationName?: string;
  ownerName: string;
  contactNumber: string;
  email?: string;
  gstNumber?: string;
  insuranceProvider?: string;
  odometerReading?: string;
  observations?: string;
}

export interface VehicleResponse {
  id: number;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  variant: string | null;
  chassisNumber: string | null;
  specs: string | null;
  registrationName: string | null;
  ownerName: string;
  contactNumber: string;
  email: string | null;
  gstNumber: string | null;
  insuranceProvider: string | null;
  odometerReading: string | null;
  observations: string | null;
  observationsAudioUrl: string | null;
  workshopOwnerId: number;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface VehicleListResponse {
  vehicles: VehicleResponse[];
  totalCount: number;
}

// Create a new vehicle
export async function createVehicle(data: CreateVehicleData) {
  return apiRequest<VehicleResponse>('/vehicle', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create vehicle with audio file
export async function createVehicleWithAudio(data: CreateVehicleData, audioFile?: RNFile) {
  const formData = new FormData();

  // Append all vehicle data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // Append audio file if provided
  if (audioFile) {
    formData.append('audioFile', audioFile as unknown as Blob);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/vehicle/with-audio`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Failed to create vehicle' };
    }

    return { success: true, data: result as VehicleResponse };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ==========================================
// CAR MASTER DATA API (Cascading Dropdowns)
// ==========================================

// Get all car brands
export async function getCarBrands() {
  return apiRequest<string[]>('/carmaster/brands', { method: 'GET' });
}

// Get models for a selected brand
export async function getCarModels(brand: string) {
  return apiRequest<string[]>(`/carmaster/models?brand=${encodeURIComponent(brand)}`, { method: 'GET' });
}

// Get available years for a selected brand + model
export async function getCarYears(brand: string, model: string) {
  return apiRequest<string[]>(
    `/carmaster/years?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`,
    { method: 'GET' },
  );
}

// Get variants for a selected brand + model + year
export async function getCarVariants(brand: string, model: string, year: string) {
  return apiRequest<string[]>(
    `/carmaster/variants?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`,
    { method: 'GET' },
  );
}

// Get all vehicles
export async function getVehicles() {
  return apiRequest<VehicleListResponse>('/vehicle', {
    method: 'GET',
  });
}


// Get vehicle by ID
export async function getVehicleById(id: number) {
  return apiRequest<VehicleResponse>(`/vehicle/${id}`, {
    method: 'GET',
  });
}

// Update vehicle
export async function updateVehicle(id: number, data: CreateVehicleData & { status: number }) {
  return apiRequest<VehicleResponse>(`/vehicle/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete vehicle
export async function deleteVehicle(id: number) {
  return apiRequest<{ message: string }>(`/vehicle/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// VEHICLE VISIT (GATE IN / GATE OUT)
// ==========================================

export interface VehicleBasicInfo {
  id: number;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  variant: string | null;
  specs: string | null;
  ownerName: string;
  contactNumber: string;
}

export interface VehicleVisitResponse {
  id: number;
  vehicleId: number;
  workshopOwnerId: number;
  status: 'In' | 'Out';
  // Gate In details
  gateInDateTime: string;
  gateInDriverName: string;
  gateInDriverContact: string;
  gateInOdometerReading: string | null;
  gateInFuelLevel: number | null;
  gateInProblemShared: string | null;
  gateInProblemAudioUrl: string | null;
  gateInImages: string[] | null;
  // Gate Out details
  gateOutDateTime: string | null;
  gateOutDriverName: string | null;
  gateOutDriverContact: string | null;
  gateOutOdometerReading: string | null;
  gateOutFuelLevel: number | null;
  gateOutImages: string[] | null;
  // Vehicle info
  vehicle: VehicleBasicInfo | null;
  // Active job card categories for this visit
  activeJobCategories: string[] | null;
  // Timestamps
  createdAt: string;
  updatedAt: string | null;
}

export interface VehicleVisitListResponse {
  visits: VehicleVisitResponse[];
  totalCount: number;
}

export interface WorkshopVehicleSummary {
  totalVehiclesIn: number;
  totalVehiclesOut: number;
  currentVehicles: VehicleVisitResponse[];
}

export interface CreateVehicleVisitData {
  vehicleId: number;
  gateInDateTime: string;
  gateInDriverName: string;
  gateInDriverContact: string;
  gateInOdometerReading?: string;
  gateInFuelLevel?: number;
  gateInProblemShared?: string;
}

export interface GateOutData {
  gateOutDriverName: string;
  gateOutDriverContact: string;
  gateOutDateTime?: string;
  gateOutOdometerReading?: string;
  gateOutFuelLevel?: number;
}

// Gate In - Create a new vehicle visit
export async function gateInVehicle(data: CreateVehicleVisitData) {
  return apiRequest<VehicleVisitResponse>('/vehiclevisit/gate-in', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Gate In with audio and images
export async function gateInVehicleWithMedia(
  data: CreateVehicleVisitData,
  audioFile?: RNFile,
  images?: RNFile[]
) {
  const formData = new FormData();

  // Append all visit data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // Append audio file if provided
  if (audioFile) {
    formData.append('audioFile', audioFile as unknown as Blob);
  }

  // Append images if provided
  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append('images', image as unknown as Blob);
    });
  }

  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/vehiclevisit/gate-in/with-media`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Failed to gate in vehicle' };
    }

    return { success: true, data: result as VehicleVisitResponse };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Gate Out - Complete a vehicle visit
export async function gateOutVehicle(visitId: number, data: GateOutData) {
  return apiRequest<VehicleVisitResponse>(`/vehiclevisit/${visitId}/gate-out`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get visit by ID
export async function getVehicleVisit(id: number) {
  return apiRequest<VehicleVisitResponse>(`/vehiclevisit/${id}`, {
    method: 'GET',
  });
}

// Get all visits for the workshop
export async function getAllVehicleVisits() {
  return apiRequest<VehicleVisitListResponse>('/vehiclevisit', {
    method: 'GET',
  });
}

// Get vehicles currently in workshop (active visits)
export async function getCurrentVehicles() {
  return apiRequest<VehicleVisitListResponse>('/vehiclevisit/current', {
    method: 'GET',
  });
}

// Get visit history (completed gate outs)
export async function getVehicleVisitHistory() {
  return apiRequest<VehicleVisitListResponse>('/vehiclevisit/history', {
    method: 'GET',
  });
}

// Get all visits for a specific vehicle
export async function getVehicleVisitsForVehicle(vehicleId: number) {
  return apiRequest<VehicleVisitListResponse>(`/vehiclevisit/vehicle/${vehicleId}`, {
    method: 'GET',
  });
}

// Get active visit for a specific vehicle
export async function getActiveVehicleVisit(vehicleId: number) {
  return apiRequest<VehicleVisitResponse>(`/vehiclevisit/vehicle/${vehicleId}/active`, {
    method: 'GET',
  });
}

// Get workshop summary (vehicles in/out count)
export async function getWorkshopVehicleSummary() {
  return apiRequest<WorkshopVehicleSummary>('/vehiclevisit/summary', {
    method: 'GET',
  });
}

// Delete a visit
export async function deleteVehicleVisit(id: number) {
  return apiRequest<{ message: string }>(`/vehiclevisit/${id}`, {
    method: 'DELETE',
  });
}

// Get vehicles currently gated-in where the logged-in staff has an assigned job card
export async function getMyStaffVehicles() {
  return apiRequest<VehicleVisitListResponse>('/jobcard/staff/my-vehicles', {
    method: 'GET',
  });
}

// ==========================================
// STAFF MANAGEMENT API
// ==========================================

// Staff Permissions interface
export interface StaffPermissions {
  vehicleApprovals: boolean;
  inquiryApprovals: boolean;
  generateEstimates: boolean;
  createJobCard: boolean;
  disputeApprovals: boolean;
  quoteApprovalsPayments: boolean;
  addVehicle: boolean;
  raiseDispute: boolean;
  createInquiry: boolean;
}

// Staff Response interface (for staff management by owner)
export interface WorkshopStaffResponse {
  id: number;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  workshopId: number;
  workshopOwnerId: number;
  city?: string;
  role: string;
  jobCategories?: string[];
  permissions: StaffPermissions;
  isActive: boolean;
  isPhoneVerified: boolean;
  registrationStatus: string;
  createdAt: string;
  updatedAt?: string;
}

// Staff List Response interface
export interface StaffListResponse {
  staff: WorkshopStaffResponse[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

// Create Staff Data interface
export interface CreateStaffData {
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  aadhaarNumber?: string;
  role: string;
  jobCategories?: string[];
  canApproveVehicles?: boolean;
  canApproveInquiries?: boolean;
  canGenerateEstimates?: boolean;
  canCreateJobCard?: boolean;
  canApproveDisputes?: boolean;
  canApproveQuotesPayments?: boolean;
  canAddVehicle?: boolean;
  canRaiseDispute?: boolean;
  canCreateInquiry?: boolean;
}

// Update Staff Data interface
export interface UpdateStaffData {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  aadhaarNumber?: string;
  role?: string;
  jobCategories?: string[];
  canApproveVehicles?: boolean;
  canApproveInquiries?: boolean;
  canGenerateEstimates?: boolean;
  canCreateJobCard?: boolean;
  canApproveDisputes?: boolean;
  canApproveQuotesPayments?: boolean;
  canAddVehicle?: boolean;
  canRaiseDispute?: boolean;
  canCreateInquiry?: boolean;
}

// Update Staff Permissions Data interface
export interface UpdateStaffPermissionsData {
  canApproveVehicles: boolean;
  canApproveInquiries: boolean;
  canGenerateEstimates: boolean;
  canCreateJobCard: boolean;
  canApproveDisputes: boolean;
  canApproveQuotesPayments: boolean;
  canAddVehicle: boolean;
  canRaiseDispute: boolean;
  canCreateInquiry: boolean;
}

// Get all staff members
export async function getStaff() {
  return apiRequest<StaffListResponse>('/staff', {
    method: 'GET',
  });
}

// Get active staff members only
export async function getActiveStaff() {
  return apiRequest<StaffListResponse>('/staff/active', {
    method: 'GET',
  });
}

// Get inactive staff members only
export async function getInactiveStaff() {
  return apiRequest<StaffListResponse>('/staff/inactive', {
    method: 'GET',
  });
}

// Get the currently authenticated staff member's own profile
export async function getStaffProfile() {
  return apiRequest<WorkshopStaffResponse>('/staff/me', {
    method: 'GET',
  });
}

// Update the currently authenticated staff member's own profile
export interface UpdateStaffSelfData {
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export async function updateStaffProfile(data: UpdateStaffSelfData) {
  return apiRequest<WorkshopStaffResponse>('/staff/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Get a specific staff member by ID
export async function getStaffById(id: number) {
  return apiRequest<WorkshopStaffResponse>(`/staff/${id}`, {
    method: 'GET',
  });
}

// Create a new staff member
export async function createStaff(data: CreateStaffData) {
  return apiRequest<WorkshopStaffResponse>('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create a new staff member with photo
export async function createStaffWithPhoto(data: CreateStaffData, photo: RNFile) {
  const formData = new FormData();

  // Add all data fields to form data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Add photo
  formData.append('photo', photo as unknown as Blob);

  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/staff/with-photo`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'An error occurred',
      };
    }

    return { success: true, data: responseData as WorkshopStaffResponse };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Update a staff member
export async function updateStaff(id: number, data: UpdateStaffData) {
  return apiRequest<WorkshopStaffResponse>(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Update staff permissions only
export async function updateStaffPermissions(id: number, data: UpdateStaffPermissionsData) {
  return apiRequest<{ message: string }>(`/staff/${id}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Upload/update staff photo
export async function uploadStaffPhoto(id: number, photo: RNFile) {
  const formData = new FormData();
  formData.append('photo', photo as unknown as Blob);

  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/staff/${id}/photo`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'An error occurred',
      };
    }

    return { success: true, data: responseData as { photoUrl: string } };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Activate a staff member
export async function activateStaff(id: number) {
  return apiRequest<{ message: string }>(`/staff/${id}/activate`, {
    method: 'PATCH',
  });
}

// Deactivate a staff member
export async function deactivateStaff(id: number) {
  return apiRequest<{ message: string }>(`/staff/${id}/deactivate`, {
    method: 'PATCH',
  });
}

// Delete a staff member
export async function deleteStaff(id: number) {
  return apiRequest<{ message: string }>(`/staff/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// JOB CARD API
// ==========================================

// JobCard interfaces
export interface JobCardResponse {
  id: number;
  vehicleId: number;
  vehicleVisitId?: number;
  workshopOwnerId: number;
  jobCategory: string;
  assignedStaffIds?: number[];
  assignedStaffNames?: string[];
  remark?: string;
  audioUrl?: string;
  images?: string[];
  videos?: string[];
  status: string; // Pending, InProgress, Completed, Cancelled
  priority: string; // Low, Normal, High, Urgent
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  vehicle?: {
    id: number;
    plateNumber: string;
    brand?: string;
    model?: string;
    year?: number;
    variant?: string;
    specs?: string;
    ownerName: string;
    contactNumber: string;
  };
}

export interface JobCardListResponse {
  jobCards: JobCardResponse[];
  totalCount: number;
}

export interface CreateJobCardData {
  vehicleId: number;
  vehicleVisitId?: number;
  jobCategory: string;
  assignedStaffIds?: number[];
  remark?: string;
  priority?: string;
}

export interface UpdateJobCardData {
  jobCategory?: string;
  assignedStaffIds?: number[];
  remark?: string;
  status?: string;
  priority?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number;
}

// Create a new job card
export async function createJobCard(data: CreateJobCardData) {
  return apiRequest<JobCardResponse>('/jobcard', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create job card with media (audio and images)
export async function createJobCardWithMedia(
  data: CreateJobCardData,
  audioFile?: RNFile,
  images?: RNFile[],
  videos?: RNFile[]
) {
  const formData = new FormData();

  // Append data
  formData.append('VehicleId', data.vehicleId.toString());
  formData.append('JobCategory', data.jobCategory);
  if (data.vehicleVisitId) formData.append('VehicleVisitId', data.vehicleVisitId.toString());
  if (data.assignedStaffIds && data.assignedStaffIds.length > 0) {
    data.assignedStaffIds.forEach(id => formData.append('AssignedStaffIds', id.toString()));
  }
  if (data.remark) formData.append('Remark', data.remark);
  if (data.priority) formData.append('Priority', data.priority);

  // Append audio
  if (audioFile) {
    formData.append('audioFile', audioFile as unknown as Blob);
  }

  // Append images
  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append('images', image as unknown as Blob);
    });
  }

  // Append videos
  if (videos && videos.length > 0) {
    videos.forEach((video) => {
      formData.append('videos', video as unknown as Blob);
    });
  }

  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/jobcard/with-media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Failed to create job card' };
    }

    return { success: true, data: result as JobCardResponse };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Get job card by ID
export async function getJobCard(id: number) {
  return apiRequest<JobCardResponse>(`/jobcard/${id}`, {
    method: 'GET',
  });
}

// Get all job cards for a vehicle
export async function getJobCardsByVehicle(vehicleId: number) {
  return apiRequest<JobCardListResponse>(`/jobcard/vehicle/${vehicleId}`, {
    method: 'GET',
  });
}

// Get all job cards for the workshop
export async function getAllJobCards() {
  return apiRequest<JobCardListResponse>('/jobcard', {
    method: 'GET',
  });
}

// Update job card
export async function updateJobCard(id: number, data: UpdateJobCardData) {
  return apiRequest<JobCardResponse>(`/jobcard/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete job card
export async function deleteJobCard(id: number) {
  return apiRequest<{ message: string }>(`/jobcard/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// INQUIRY (PART REQUESTS)
// ==========================================

export interface InquiryItemRequest {
  partName: string;
  preferredBrand: string;
  quantity: number;
  remark: string;
  audioUrl?: string;
  audioDuration?: number;
  image1Url?: string;
  image2Url?: string;
  image3Url?: string;
}

export interface CreateInquiryRequest {
  vehicleId: number;
  vehicleVisitId?: number;
  workshopOwnerId: number;
  requestedByStaffId: number | null;
  jobCategories: string[];
  items: InquiryItemRequest[];
}

export interface InquiryItemResponse {
  id: number;
  partName: string;
  preferredBrand: string;
  quantity: number;
  remark: string;
  audioUrl: string | null;
  audioDuration: number | null;
  image1Url: string | null;
  image2Url: string | null;
  image3Url: string | null;
  createdAt: string;
}

export interface InquiryResponse {
  id: number;
  vehicleId: number;
  vehicleVisitId: number | null;
  workshopOwnerId: number;
  requestedByStaffId: number | null;
  inquiryNumber: string;
  jobCategories: string[];
  status: string;
  placedDate: string;
  closedDate: string | null;
  declinedDate: string | null;
  items: InquiryItemResponse[];
  vehicleName: string | null;
  numberPlate: string | null;
  requestedByName: string | null;
  workshopName: string | null;
}

export interface InquiryListResponse {
  inquiries: InquiryResponse[];
  totalCount: number;
}

// Create a new inquiry
export async function createInquiry(data: CreateInquiryRequest) {
  return apiRequest<InquiryResponse>('/inquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Create inquiry with media files
export async function createInquiryWithMedia(
  vehicleId: number,
  workshopOwnerId: number,
  jobCategories: string[],
  items: InquiryItemRequest[],
  audioFiles: RNFile[],
  imageFiles: RNFile[],
  vehicleVisitId?: number,
  requestedByStaffId?: number | null
) {
  try {
    const token = await getAuthToken();
    const formData = new FormData();

    // Append basic fields
    formData.append('vehicleId', vehicleId.toString());
    formData.append('workshopOwnerId', workshopOwnerId.toString());
    formData.append('jobCategoriesJson', JSON.stringify(jobCategories));
    formData.append('itemsJson', JSON.stringify(items));

    if (vehicleVisitId) {
      formData.append('vehicleVisitId', vehicleVisitId.toString());
    }
    if (requestedByStaffId !== undefined && requestedByStaffId !== null) {
      formData.append('requestedByStaffId', requestedByStaffId.toString());
    }

    // Append audio files
    audioFiles.forEach((file, index) => {
      if (file && file.uri) {
        formData.append('audioFiles', {
          uri: file.uri,
          name: file.name || `audio_${index}.mp4`,
          type: file.type || 'audio/mp4',
        } as any);
      }
    });

    // Append image files
    imageFiles.forEach((file, index) => {
      if (file && file.uri) {
        formData.append('imageFiles', {
          uri: file.uri,
          name: file.name || `image_${index}.jpg`,
          type: file.type || 'image/jpeg',
        } as any);
      }
    });

    const response = await fetch(`${API_BASE_URL}/inquiry/with-media`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Failed to create inquiry with media' };
    }

    return { success: true, data: result as InquiryResponse };
  } catch (error) {
    console.error('API Error (createInquiryWithMedia):', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Get inquiry by ID
export async function getInquiryById(id: number) {
  return apiRequest<InquiryResponse>(`/inquiry/${id}`, {
    method: 'GET',
  });
}

// Get inquiries by vehicle ID
export async function getInquiriesByVehicleId(vehicleId: number) {
  return apiRequest<InquiryListResponse>(`/inquiry/vehicle/${vehicleId}`, {
    method: 'GET',
  });
}

// Get inquiries by workshop owner ID
export async function getInquiriesByWorkshopOwnerId(workshopOwnerId: number) {
  return apiRequest<InquiryListResponse>(`/inquiry/workshop/${workshopOwnerId}`, {
    method: 'GET',
  });
}

// Update inquiry status
export async function updateInquiryStatus(id: number, status: string) {
  return apiRequest<{ message: string; status: string }>(`/inquiry/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Delete inquiry
export async function deleteInquiry(id: number) {
  return apiRequest<{ message: string }>(`/inquiry/${id}`, {
    method: 'DELETE',
  });
}

// Update inquiry item
export async function updateInquiryItem(itemId: number, data: Partial<InquiryItemResponse>) {
  return apiRequest<{ message: string }>(`/inquiry/item/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateInquiryItems(inquiryId: number, items: InquiryItemRequest[]) {
  return apiRequest<{ message: string }>(`/inquiry/${inquiryId}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

// ==========================================
// QUOTES
// ==========================================

export interface QuoteItemApiResponse {
  id: number;
  inquiryItemId: number;
  partName: string;
  partNumber: string;
  brand: string;
  description: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  availability: string;
  estimatedDelivery: string | null;
  createdAt: string;
}

export interface QuoteApiResponse {
  id: number;
  quoteNumber: string;
  inquiryId: number;
  vehicleId: number;
  workshopOwnerId: number;
  inquiryNumber: string | null;
  vehicleName: string | null;
  plateNumber: string | null;
  workshopName: string | null;
  packingCharges: number;
  forwardingCharges: number;
  shippingCharges: number;
  totalAmount: number;
  status: string;
  items: QuoteItemApiResponse[];
  createdAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
}

export interface QuoteListApiResponse {
  quotes: QuoteApiResponse[];
  totalCount: number;
}

// Get quotes by vehicle ID
export async function getQuotesByVehicleId(vehicleId: number) {
  return apiRequest<QuoteListApiResponse>(`/quote/vehicle/${vehicleId}`, {
    method: 'GET',
  });
}

// Get quotes by workshop owner ID
export async function getQuotesByWorkshopOwnerId(workshopOwnerId: number) {
  return apiRequest<QuoteListApiResponse>(`/quote/workshop/${workshopOwnerId}`, {
    method: 'GET',
  });
}

// Get quote by ID
export async function getQuoteById(id: number) {
  return apiRequest<QuoteApiResponse>(`/quote/${id}`, {
    method: 'GET',
  });
}

// Update quote status
export async function updateQuoteStatus(id: number, status: string) {
  return apiRequest<{ message: string; status: string }>(`/quote/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ==========================================
// PAYMENT (RAZORPAY)
// ==========================================

export interface CreatePaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  quoteNumber: string;
}

export interface VerifyPaymentResponse {
  message: string;
  paymentId: string;
  quoteId: number;
  status: string;
}

// Create a Razorpay payment order for a quote
// Pass selectedItemIds for partial payment (only charge for those items)
export async function createPaymentOrder(quoteId: number, selectedItemIds?: number[]) {
  return apiRequest<CreatePaymentOrderResponse>('/payment/create-order', {
    method: 'POST',
    body: JSON.stringify({ quoteId, selectedItemIds: selectedItemIds ?? null }),
  });
}

// Verify Razorpay payment and update quote status
export async function verifyPayment(data: {
  quoteId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  selectedItemIds?: number[];
}) {
  return apiRequest<VerifyPaymentResponse>('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get Razorpay public key
export async function getRazorpayKey() {
  return apiRequest<{ keyId: string }>('/payment/key', {
    method: 'GET',
  });
}

// ==========================================
// ORDERS
// ==========================================

export interface WorkshopOrderListItem {
  id: number;
  orderNumber: string;
  quoteNumber: string;
  inquiryNumber: string;
  workshopName: string;
  assignedSalesPersonName: string | null;
  source: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  vehicleName: string | null;
  plateNumber: string | null;
}

export interface WorkshopOrderListResponse {
  orders: WorkshopOrderListItem[];
  totalCount: number;
}

export async function getOrdersByWorkshopId(workshopOwnerId: number) {
  return apiRequest<WorkshopOrderListResponse>(`/order/workshop/${workshopOwnerId}`, {
    method: 'GET',
  });
}

export async function getOrdersByVehicleId(vehicleId: number) {
  return apiRequest<WorkshopOrderListResponse>(`/order/vehicle/${vehicleId}`, {
    method: 'GET',
  });
}

export interface OrderItemApiResponse {
  id: number;
  quoteItemId: number | null;
  partName: string;
  partNumber: string;
  brand: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface OrderDetailApiResponse {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  estimatedDeliveryDate: string | null;
  vehicleName: string | null;
  plateNumber: string | null;
  items: OrderItemApiResponse[];
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleVariant?: string;
  createdAt: string;
  deliveryDriverName?: string;
  deliveryDriverContact?: string;
  deliveryPartnerName?: string;
  packingCharges?: number;
  forwardingCharges?: number;
  shippingCharges?: number;
  lrNumber?: string;
  workshopPhone?: string;
}

export async function getOrderById(id: number) {
  return apiRequest<OrderDetailApiResponse>(`/order/${id}`, {
    method: 'GET',
  });
}

// ==========================================
// DISPUTES
// ==========================================

export interface DisputeListItemResponse {
  id: number;
  disputeNumber: string;
  orderNumber: string;
  workshopName: string;
  contactPerson: string;
  issue: string;
  category: string;
  priority: string;
  status: string;
  date: string;
  assignedTo: string | null;
}

export interface DisputeCommentResponse {
  id: number;
  disputeId: number;
  senderName: string;
  senderRole: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DisputeAttachmentResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface DisputeDetailResponse {
  id: number;
  disputeNumber: string;
  orderNumber: string;
  workshopId: number;
  workshopName: string;
  contactPerson: string;
  phoneNumber: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  assignedToId: number | null;
  raisedOn: string;
  resolvedOn: string | null;
  resolvedBy: string | null;
  resolutionDetails: string | null;
  attachments: DisputeAttachmentResponse[];
}

// Get disputes by workshop owner
export async function getDisputesByWorkshopOwner(workshopOwnerId: number) {
  return apiRequest<DisputeListItemResponse[]>(
    `/disputes/workshop-owner/${workshopOwnerId}`,
    {method: 'GET'}
  );
}

// Get dispute by ID
export async function getDisputeById(id: number) {
  return apiRequest<DisputeDetailResponse>(`/disputes/${id}`, {
    method: 'GET',
  });
}

// Get dispute comments
export async function getDisputeComments(id: number) {
  return apiRequest<DisputeCommentResponse[]>(`/disputes/${id}/comments`, {
    method: 'GET',
  });
}

// Create dispute with files (multipart/form-data)
export async function createDisputeWithFiles(
  orderId: number,
  workshopOwnerId: number,
  partName: string,
  reason: string,
  remark: string,
  partId?: number,
  audioFile?: RNFile,
  image1?: RNFile,
  image2?: RNFile,
  image3?: RNFile
) {
  try {
    const token = await getAuthToken();
    const formData = new FormData();

    // Append text fields
    formData.append('orderId', orderId.toString());
    formData.append('workshopOwnerId', workshopOwnerId.toString());
    formData.append('partName', partName);
    formData.append('reason', reason);
    formData.append('remark', remark);
    if (partId) {
      formData.append('partId', partId.toString());
    }

    // Append files
    if (audioFile) {
      formData.append('audioFile', {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.type,
      } as any);
    }

    if (image1) {
      formData.append('image1', {
        uri: image1.uri,
        name: image1.name,
        type: image1.type,
      } as any);
    }

    if (image2) {
      formData.append('image2', {
        uri: image2.uri,
        name: image2.name,
        type: image2.type,
      } as any);
    }

    if (image3) {
      formData.append('image3', {
        uri: image3.uri,
        name: image3.name,
        type: image3.type,
      } as any);
    }

    const response = await fetch(`${API_BASE_URL}/disputes/with-files`, {
      method: 'POST',
      headers: {
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.errors?.[0] || 'Failed to create dispute',
      };
    }

    return {success: true, data};
  } catch (error) {
    console.error('API Error (createDisputeWithFiles):', error);
    return {success: false, error: 'Network error. Please try again.'};
  }
}

// ==========================================
// PUSH NOTIFICATIONS (FCM)
// ==========================================

// Store FCM token in backend
export async function setFcmToken(token: string, platform: string) {
  return apiRequest<{ message: string }>('/notification/register-token', {
    method: 'POST',
    body: JSON.stringify({ fcmToken: token, platform }),
  });
}

// Remove FCM token from backend (on logout)
export async function removeFcmToken() {
  return apiRequest<{ message: string }>('/notification/remove-token', {
    method: 'DELETE',
  });
}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

export interface DashboardStatsResponse {
  ordersInProcess: number;
  pendingQuotes: number;
  pendingPartRequests: number;
  raisedDisputes: number;
}

// Get dashboard statistics for authenticated workshop owner
export async function getDashboardStats() {
  return apiRequest<DashboardStatsResponse>('/dashboard/stats', {
    method: 'GET',
  });
}

// ==========================================
// WORKSHOP OWNER PROFILE
// ==========================================

export interface PersonalInfo {
  ownerName: string;
  contactNumber: string;
  email?: string;
}

export interface WorkshopDetails {
  workshopName: string;
  gstNumber?: string;
  tradeLicense?: string;
  aadhaarNumber: string;
  address: string;
}

export interface ProfileData {
  name: string;
  avatarUrl?: string;
  personalInfo: PersonalInfo;
  workshopDetails: WorkshopDetails;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfileData;
}

export interface UpdateProfileData {
  ownerName?: string;
  contactNumber?: string;
  email?: string;
  workshopName?: string;
  gstNumber?: string;
  tradeLicense?: string;
  aadhaarNumber?: string;
  address?: string;
}

// Get authenticated workshop owner's profile
export async function getProfile() {
  return apiRequest<ProfileResponse>('/workshop/profile', {
    method: 'GET',
  });
}

// Update authenticated workshop owner's profile
export async function updateProfile(data: UpdateProfileData) {
  return apiRequest<{ success: boolean; message: string }>('/workshop/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
