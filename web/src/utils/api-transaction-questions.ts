// Transaction Questions API utilities
import { apiRequest } from './api'

export interface TransactionQuestion {
  id: string
  company_id: string
  transaction_id: string
  transaction_date: string
  transaction_type: string
  vendor_name: string | null
  payee_name: string | null
  description: string | null
  account_name: string | null
  amount: number
  status: 'pending' | 'answered' | 'resolved'
  chat_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateTransactionQuestionRequest {
  company_id: string
  transaction_id: string
  transaction_date: string
  transaction_type: string
  vendor_name?: string | null
  payee_name?: string | null
  description?: string | null
  account_name?: string | null
  amount: number
  // Initial question text (stored as first chat message, not in transaction_questions table)
  question_text: string
}

// Get all transaction questions for a company
export async function getTransactionQuestions(
  companyId: string,
  authToken?: string
): Promise<TransactionQuestion[]> {
  try {
    const response: any = await apiRequest(`/integrations/quickbooks/transaction-questions/${companyId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
    return response.data || response
  } catch (error: any) {
    // Return empty array for 404 (no questions yet) - this is expected behavior
    if (error?.status === 404 || error?.message?.includes('Not Found') || error?.message?.includes('404')) {
      return []
    }
    throw error
  }
}

// Create a new transaction question
export async function createTransactionQuestion(
  data: CreateTransactionQuestionRequest,
  authToken?: string
): Promise<TransactionQuestion> {
  return apiRequest(`/integrations/quickbooks/transaction-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify(data)
  })
}

// Update transaction question status
export async function updateTransactionQuestionStatus(
  questionId: string,
  status: 'pending' | 'answered' | 'resolved',
  authToken?: string
): Promise<TransactionQuestion> {
  return apiRequest(`/integrations/quickbooks/transaction-questions/${questionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({ status })
  })
}

// Get transaction question by transaction ID
export async function getTransactionQuestionByTransactionId(
  companyId: string,
  transactionId: string,
  authToken?: string
): Promise<TransactionQuestion | null> {
  try {
    return await apiRequest(
      `/integrations/quickbooks/transaction-questions/${companyId}/${transactionId}`,
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    )
  } catch (error) {
    return null
  }
}

// Pre-defined questions users can select
export const TRANSACTION_QUESTIONS = [
  'What is this for?',
  'Is this a business expense?',
  'Which category?'
]

// Get chat messages for a transaction question
export async function getTransactionQuestionChats(
  questionId: string,
  authToken?: string
): Promise<any[]> {
  try {
    // Use /chat endpoint with transaction_question_id filter instead of dedicated endpoint
    const response: any = await apiRequest(`/chat?transaction_question_id=${questionId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })

    // Normalize to an array; some endpoints return { data: [...] }
    const primary = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : []

    return primary
  } catch (error) {
    console.error('Error fetching transaction question chats:', error)
    return []
  }
}

// Send a message to a transaction question chat
export async function sendTransactionQuestionChatMessage(
  questionId: string,
  message: string,
  authToken?: string
): Promise<any> {
  return apiRequest(`/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({
      question_id: questionId,
      message
    })
  })
}
