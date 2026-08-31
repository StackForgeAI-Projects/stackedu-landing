const GUIDE_PREFIX = 'stackedu:guide:'

export function pageGuideStorageKey(pageKey: string): string {
  return `${GUIDE_PREFIX}${pageKey}`
}

export function isPageGuideDismissed(pageKey: string): boolean {
  try {
    return sessionStorage.getItem(pageGuideStorageKey(pageKey)) === '1'
  } catch {
    return false
  }
}

export function dismissPageGuide(pageKey: string): void {
  try {
    sessionStorage.setItem(pageGuideStorageKey(pageKey), '1')
  } catch {
    /* ignore */
  }
}

/** Clears dismissed guides so they reappear after the next sign-in. */
export function clearDismissedPageGuides(): void {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(GUIDE_PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}
