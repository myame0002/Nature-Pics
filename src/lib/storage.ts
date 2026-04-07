import type { FieldGuideEntry } from '../types'

export const fieldGuideStorageKey = 'nature-lens-field-guide:v1'

export function loadFieldGuideEntries() {
  if (typeof window === 'undefined') {
    return [] as FieldGuideEntry[]
  }

  try {
    const raw = window.localStorage.getItem(fieldGuideStorageKey)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((entry) => ({
      ...entry,
      taxonomy: entry.taxonomy ?? null,
      chatHistory: Array.isArray(entry.chatHistory) ? entry.chatHistory : [],
    })) as FieldGuideEntry[]
  } catch {
    return []
  }
}

export function saveFieldGuideEntries(entries: FieldGuideEntry[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(fieldGuideStorageKey, JSON.stringify(entries))
}

export function createEntryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `entry-${Date.now()}`
}