const LOCAL_API_BASE_URL = 'http://localhost:3002';
const CLOUD_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL_AA ||
  'https://threed-warehouse-management-system.onrender.com';

const apiTarget = import.meta.env.VITE_API_TARGET || 'local';

const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (apiTarget === 'cloud' ? CLOUD_API_BASE_URL : LOCAL_API_BASE_URL);

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');

