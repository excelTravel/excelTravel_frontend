// Runtime config from Vite env (VITE_*). Only public values live here — never secrets.
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '',
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  },
  mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL ?? '',
} as const;

// When a Clerk publishable key is set, login is enforced; otherwise the app runs open (backend dev-auth).
export const authEnabled = Boolean(config.clerkPublishableKey);

