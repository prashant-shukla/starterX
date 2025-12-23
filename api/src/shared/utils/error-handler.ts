export function createErrorResponse(error: any, defaultMessage = 'An unexpected error occurred') {
  console.error('Error handler caught:', error)
  const rawMessage = error?.message
  const message = rawMessage && typeof rawMessage === 'string' && rawMessage.trim().length > 0 ? rawMessage : defaultMessage
  return { error: message, statusCode: error?.statusCode || 500 }
}
