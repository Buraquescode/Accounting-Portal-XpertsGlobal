import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL, withCredentials: true });

// AuthContext registers a callback so a 401 clears the user and sends them to /login.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

// These calls expect a 401 when logged out, so they must not trigger the redirect.
const QUIET_401 = ['/auth/login', '/auth/me'];

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    if (status === 401 && !QUIET_401.some((p) => error.config?.url?.includes(p))) onUnauthorized();
    // Normalize every failure to { message, errors, status }.
    return Promise.reject({
      message: body?.message || (error.request ? 'Cannot reach the server. Check your connection.' : 'Something went wrong.'),
      errors: body?.errors,
      status,
    });
  },
);

export default client;
