/**
 * API Configuration
 * Auth calls route directly to auth-service
 * All other calls route through the API gateway
 */

export const GATEWAY_URL  = 'http://localhost:8080';
export const AUTH_URL     = 'http://localhost:8081';

// Authentication token helper methods
export const getToken    = () => localStorage.getItem('accessToken');
export const getRole     = () => localStorage.getItem('role');
export const getEmail    = () => localStorage.getItem('email');
export const getUserName = () => localStorage.getItem('fullName');
export const isSuspended = () => localStorage.getItem('suspended') === 'true';

export const saveAuth = (data) => {
  localStorage.setItem('accessToken',  data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('role',         data.role);
  localStorage.setItem('email',        data.email);
  localStorage.setItem('fullName',     data.fullName);
  localStorage.setItem('userId',       data.userId);
  const isSuspendedUser = data.suspended === true || data.suspended === 'true' || data.isSuspended === true || data.isSuspended === 'true' || data.active === false || data.active === 'false';
  localStorage.setItem('suspended',    isSuspendedUser);
};

export const clearAuth = () => {
  ['accessToken','refreshToken','role','email','fullName','userId','suspended']
    .forEach(k => localStorage.removeItem(k));
};

export const isLoggedIn = () => !!getToken();

// Core fetch wrapper for authenticated API requests
export const apiFetch = async (path, options = {}, baseUrl = GATEWAY_URL) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (options.raw) return response;

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data.message || `Request failed: ${response.status}`;
    
    if (response.status === 401 && message.includes('suspended')) {
      if (!isSuspended()) {
        localStorage.setItem('suspended', 'true');
        window.location.reload();
      }
    }
    
    throw new Error(message);
  }

  return data;
};

// Convenience HTTP methods for API interaction
// api → goes through gateway (port 8080)
export const api = {
  get:      (path)       => apiFetch(path),
  post:     (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:      (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:   (path)       => apiFetch(path, { method: 'DELETE' }),
  download: (path)       => apiFetch(path, { raw: true }),
};

// authApi routes through the gateway (port 8080)
export const authApi = {
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }, GATEWAY_URL),
};
