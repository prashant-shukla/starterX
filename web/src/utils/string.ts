export function safeCapitalize(s: any, fallback = 'Unknown') {
  if (typeof s !== 'string') return fallback
  if (s.length === 0) return fallback
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default { safeCapitalize }
