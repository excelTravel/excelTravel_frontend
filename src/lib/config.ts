// Runtime config from Vite env (VITE_*). Only public values live here — never secrets.
export const config = {
  // Includes the /api/v1 prefix — hooks call resource-relative paths (e.g. apiFetch('/trips')).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  },
  mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL ?? '',
} as const;

// Login is always enforced (in-house OTP auth — every page is gated behind a session).
export const authEnabled = true;

