/**
 * Date utility helpers for Trip Itinerary scheduling and date derivation.
 * Operates purely on YYYY-MM-DD to avoid timezone distortion.
 */

export function parseDateString(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(dateVal).split('T')[0];
}

/**
 * Calculates derived calendar date for an itinerary day:
 * trip.start_date + (day_number - 1)
 */
export function calculateDerivedDate(startDateVal, dayNumber) {
  if (!startDateVal || !dayNumber) return null;
  const sStr = parseDateString(startDateVal);
  if (!sStr) return null;
  const parts = sStr.split('-').map(Number);
  if (parts.length < 3) return null;
  
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + (parseInt(dayNumber, 10) - 1)));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates total days of a trip:
 * (end_date - start_date) + 1
 */
export function getTripTotalDays(startDateVal, endDateVal) {
  if (!startDateVal || !endDateVal) return null;
  const sStr = parseDateString(startDateVal);
  const eStr = parseDateString(endDateVal);
  if (!sStr || !eStr) return null;
  
  const sParts = sStr.split('-').map(Number);
  const eParts = eStr.split('-').map(Number);
  if (sParts.length < 3 || eParts.length < 3) return null;
  
  const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
  const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
  const diffDays = Math.round((eUtc - sUtc) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 1;
}

/**
 * Formats a YYYY-MM-DD date into "June 10, 2026"
 */
export function formatDateLong(dateVal) {
  if (!dateVal) return '';
  const dStr = parseDateString(dateVal);
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Formats a YYYY-MM-DD date into "Wed, Jun 10" or "Mon, Jun 15"
 */
export function formatDateWithWeekday(dateVal) {
  if (!dateVal) return '';
  const dStr = parseDateString(dateVal);
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}
