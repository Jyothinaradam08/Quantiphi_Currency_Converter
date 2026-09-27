const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request(path, { method = 'GET', body, query, signal } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }

  let response
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Unable to reach the server. Is the backend running?', { code: 'NETWORK' })
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload?.error
    throw new ApiError(error?.message || `Request failed (${response.status})`, {
      status: response.status,
      code: error?.code,
      details: error?.details,
    })
  }
  return payload
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
