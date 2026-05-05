/**
 * Standard API response builder
 */
const buildResponse = (success, message, data = null, statusCode = 200) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  return { statusCode, body: response };
};

/**
 * Determine sleep quality based on hours
 */
const getSleepQuality = (hours) => {
  if (hours < 5) return 'POOR';       // أحمر
  if (hours <= 7) return 'MODERATE';   // أصفر
  return 'GOOD';                       // أزرق
};

/**
 * Get today's date as Date object (no time)
 * Constructs a UTC date based on the local YYYY-MM-DD string
 * to prevent timezone offsets from shifting the date in Prisma (@db.Date)
 */
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

/**
 * Parse date string to Date object
 * Ensures the parsed string YYYY-MM-DD is treated as UTC
 */
const parseDate = (dateStr) => {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(`${dateStr}T00:00:00.000Z`);
};

module.exports = { buildResponse, getSleepQuality, getTodayDate, parseDate };
