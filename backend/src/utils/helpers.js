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
 */
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Parse date string to Date object
 */
const parseDate = (dateStr) => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
};

module.exports = { buildResponse, getSleepQuality, getTodayDate, parseDate };
