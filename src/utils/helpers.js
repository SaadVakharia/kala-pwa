/**
 * Format raw input to standard E.164 phone format (+91XXXXXXXXXX)
 * @param {string} raw 
 * @returns {string}
 */
export function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

/**
 * Returns a time-of-day greeting (Good Morning / Good Afternoon / Good Evening)
 * @returns {string}
 */
export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}
