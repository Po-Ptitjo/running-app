const STORAGE_KEY = 'runpace_v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Storage error:', e)
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

// Deep clone to avoid mutation
export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}
