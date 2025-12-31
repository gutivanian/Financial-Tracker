// pftu\lib\api.ts
// API utility functions with authentication

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token invalid or expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

export const apiGet = async (url: string) => {
  const response = await fetchWithAuth(url);
  return response.json();
};

export const apiPost = async (url: string, data: any) => {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiPut = async (url: string, data: any) => {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiDelete = async (url: string) => {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  return response.json();
};