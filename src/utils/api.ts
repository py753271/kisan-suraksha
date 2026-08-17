import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ks_logged_in', 'true');
    }
    onRefreshed(token);
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ks_logged_in');
    }
  }
};

export const getAccessToken = () => accessToken;

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  withCredentials: true, // sends refresh token cookies automatically
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!navigator.onLine) {
      return Promise.reject(new Error('OFFLINE'));
    }
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Rotate JWT on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.message === 'OFFLINE') {
      return Promise.reject({ status: 'offline', message: 'You are currently offline. Please check your network connection.' });
    }

    if (!error.response) {
      return Promise.reject({ status: 500, message: 'Server is currently unreachable.' });
    }

    const { status } = error.response;

    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.data.accessToken;
        setAccessToken(newToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth_logout'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject({
      status,
      message: (error.response.data as any)?.message || 'An API error occurred.',
    });
  }
);
