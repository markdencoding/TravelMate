/**
 * TravelMate Automatic & Manual Theme System
 * 
 * Rules:
 * 1. Automatic Day/Night selection is computed from user's local device time.
 *    06:00 – 17:59 (6 AM to 5:59 PM) => 'light'
 *    18:00 – 05:59 (6 PM to 5:59 AM) => 'dark'
 * 2. On app open / initial load, if the user explicitly manually selected a theme
 *    during the active session, that manual preference is respected for the session.
 * 3. Otherwise, the initial theme defaults to the local-time day/night theme.
 * 4. When the user manually toggles the theme, it saves to both session and local storage
 *    so the user's manual choice remains stable and is not abruptly overridden every minute.
 */

export const DAY_START_HOUR = 6;    // 06:00 (6 AM)
export const NIGHT_START_HOUR = 18;  // 18:00 (6 PM)

/**
 * Computes the theme based strictly on the user's local device clock.
 * @param {Date} [date] Optional custom date for testing/simulation.
 * @returns {'light' | 'dark'}
 */
export function getAutoTheme(date = new Date()) {
  const currentHour = date.getHours();
  return (currentHour >= DAY_START_HOUR && currentHour < NIGHT_START_HOUR) ? 'light' : 'dark';
}

/**
 * Determines the initial theme on app startup.
 * Respects active session manual override if present; otherwise applies local-time auto theme.
 * @returns {'light' | 'dark'}
 */
export function getInitialTheme() {
  try {
    const sessionManual = sessionStorage.getItem('travelmate-theme-manual');
    if (sessionManual === 'light' || sessionManual === 'dark') {
      return sessionManual;
    }
  } catch (err) {
    console.warn('Session storage inaccessible for theme preference:', err);
  }

  return getAutoTheme();
}

/**
 * Persists user's manual theme selection.
 * @param {'light' | 'dark'} theme 
 */
export function saveThemePreference(theme) {
  try {
    sessionStorage.setItem('travelmate-theme-manual', theme);
    localStorage.setItem('travelmate-theme', theme);
  } catch (err) {
    console.warn('Storage inaccessible for theme preference:', err);
  }
}
