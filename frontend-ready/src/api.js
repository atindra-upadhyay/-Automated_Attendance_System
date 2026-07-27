const BASE_URL = process.env.REACT_APP_API_URL || 'https://automated-attendance-system-ddz5.onrender.com';
const API = (endpoint) => `${BASE_URL.replace(/\/$/, '')}/api/${endpoint.replace(/^\//, '')}`;

export async function apiFetch(endpoint, options = {}){
  const url = API(endpoint);
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')){
    const text = await res.text();
    const err = new Error(`Unexpected response from ${url}: HTTP ${res.status}`);
    err.responseText = text;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!res.ok || data.ok === false){
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export default API;
