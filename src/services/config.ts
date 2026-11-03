// The one place that decides which backend the app talks to. api.ts and otpAuth.ts both read it,
// so login (OTP) and data calls can never point at different servers.

const PRODUCTION_ORIGIN = 'https://api.partsnow.in';
const LOCAL_ORIGIN = 'https://dotnet.ujjwaltamrakar.in'; // Cloudflared tunnel that points to localhost:5000

// Debug builds (Metro / run-android / run-ios) use the local backend while this is true; set it to
// false to run a debug build against production. Release builds always use production, whatever
// this says, so a tunnel URL can't ship by accident.
const USE_LOCAL_BACKEND = true;

export const SERVER_ORIGIN =
  __DEV__ && USE_LOCAL_BACKEND ? LOCAL_ORIGIN : PRODUCTION_ORIGIN;
export const API_BASE_URL = `${SERVER_ORIGIN}/api`;
