let csrfToken = '';

function buildHeaders(method, hasBody) {
  const headers = {
    Accept: 'application/json'
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const upperMethod = method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : '';
}

export function getCsrfToken() {
  return csrfToken;
}

export async function apiRequest(url, options = {}) {
  const method = options.method || 'GET';
  const hasBody = options.body !== undefined;

  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: buildHeaders(method, hasBody),
    body: hasBody ? JSON.stringify(options.body) : undefined
  });

  const isJson = String(response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload && payload.error ? payload.error : 'Falha na requisicao.';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (payload && typeof payload.csrfToken === 'string') {
    csrfToken = payload.csrfToken;
  }

  return payload;
}

export async function loadSession() {
  const session = await apiRequest('/api/auth/session');
  if (session && typeof session.csrfToken === 'string') {
    csrfToken = session.csrfToken;
  }
  return session;
}
