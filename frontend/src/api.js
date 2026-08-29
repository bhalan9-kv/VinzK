const API = '';

async function request(path, options = {}) {
  const token = localStorage.getItem('cf_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export const auth = {
  register: (email, password, name) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/api/auth/me'),
};

export const cases = {
  list: () => request('/api/cases'),
  get: (id) => request(`/api/cases/${id}`),
};

export const sessions = {
  start: (case_id, timed, time_limit_seconds, difficulty) =>
    request('/api/sessions', { method: 'POST', body: JSON.stringify({ case_id, timed, time_limit_seconds, difficulty }) }),
  message: (id, content, time_remaining_seconds) =>
    request(`/api/sessions/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, time_remaining_seconds }),
    }).then(data => {
      // Expose termination status from the response
      data.terminated_early = data.terminated_early || false;
      return data;
    }),
  complete: (id) => request(`/api/sessions/${id}/complete`, { method: 'POST' }),
  list: () => request('/api/sessions'),
  get: (id) => request(`/api/sessions/${id}`),
};

export const bookmarks = {
  list: () => request('/api/bookmarks'),
  add: (case_id) => request('/api/bookmarks', { method: 'POST', body: JSON.stringify({ case_id }) }),
  remove: (case_id) => request(`/api/bookmarks/${case_id}`, { method: 'DELETE' }),
};

export const progress = {
  get: () => request('/api/progress'),
};
