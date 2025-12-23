export interface AdminClientDetailProps {
  clientId?: string
  onBack?: () => void
  initialClientData?: Client
  accessToken?: string
  isManager?: boolean
}

export interface Client {
  id: string
  client_id?: string // Add client_id for chat messages
  name: string
  client_name?: string
  clientName?: string
  firstName: string
  lastName: string
  status: string
  assigned: string
  assigned_name?: string
  manager: string
  // Additional optional server variants and normalized fields we read at runtime
  status_name?: string
  current_stage?: string
  // bookkeeping stage flags (server may provide booleans or summary fields)
  onboarding_in_progress?: boolean
  catchup_in_progress?: boolean
  monthly_in_progress?: boolean
  // assigned/manager legacy variants
  assigned_to?: string
  assigned_contractor_id?: string
  assigned_manager_id?: string
  manager_name?: string
  managed_by?: string
  // chat status legacy snake_case
  chat_status?: string
  currentStage?: string
  currentStatus?: string
  closeDateRange: string | { raw?: string; start?: string | null; end?: string | null }
  closeDue: number
  closeStatus: string
  email: string
  phone: string
  address: string
  monthlyFee: number
  catchUpFee: number
  cfoFee?: number
  payrollFee?: number
  qbFee?: number
  bankName?: string
  fullBankName: string
  accountingNumber: string
  accountNumber?: string
  routingNumber: string
  signDate: string
  referredFrom?: string
  additionalServices: string
  chatStatus: string
  paymentStatus: string
  monthlyPaymentStatus?: string
  catchUpPaymentStatus?: string
  cfoPaymentStatus?: string
  payrollPaymentStatus?: string
  qbPaymentStatus?: string
  history?: Array<{ date: string; due: number; status: string }>
  lastLogin?: string
  joinedDate?: string
  generalTasks: { completed: number; total: number }
  categorization: { completed: number; total: number }
  reconciliation: { completed: number; total: number }
  reviewTask: { completed: number; total: number }
  newPassword?: string
  generated_password?: string | null
  analysis_required?: boolean
}

export interface Question {
  id: number
  // Note: components expect a few different field names; keep a superset for compatibility
  date?: string
  createdAt?: string
  respondedAt?: string
  completedAt?: string
  subject?: string
  description?: string
  type?: string
  account?: string
  amount?: number
  status?: 'open' | 'responded' | 'completed'
  priority?: string
  question?: string
  response?: string
  category?: string
  // fields used by ClientDirectory sample data
  clientId?: string
  clientName?: string
  firstName?: string
  lastName?: string
  createdDate?: string
  assignedTo?: string
}

export interface ChatMessage {
  id: string | number
  message?: string
  // legacy alias: some components still use `content` field — keep optional for compatibility
  content?: string
  sender: 'admin' | 'client'
  timestamp: string
  senderName: string
}

export interface ParsedQuestion {
  date: string
  description: string
  type: string
  account: string
  amount: number
}

export interface EditQuestion {
  date: string
  description: string
  type: string
  account: string
  amount: number
  status: string
}

export interface SubtaskObject {
  name: string
  completed?: boolean | number
}

export interface Task {
  // Accept legacy runtime shapes: completed may be boolean or numeric, subtasks may be strings
  completed?: boolean | number
  total?: number
  subtasks?: Array<SubtaskObject | string>
  customName?: string | null
  // Optional UI/metadata used in constants
  name?: string
  notes?: string | null
  assignee?: string
  dueDate?: string | number | null
}

export interface WorkflowSection {
  status: string
  lastUpdated: string
  // Use a flexible tasks record because some constants and runtime shapes are heterogeneous
  tasks: Record<string, any>
  startDate?: string
  endDate?: string
  dueDate?: string
  // For catchUp onboarding there are month/year fields
  startMonth?: string
  startYear?: string
  endMonth?: string
  endYear?: string
}

export interface WorkflowData {
  general: Pick<WorkflowSection, 'status' | 'lastUpdated'>
  onboarding: WorkflowSection
  catchUp: WorkflowSection
  monthly: WorkflowSection
}

export interface Document {
  id: number
  fileName: string
  size: string
  uploadedDate: string
  // additional optional metadata used in sample documents
  clientId?: string
  clientName?: string
  name?: string
  type?: string
  folder?: string
  category?: string
  uploadedBy?: string
}

// Extend Client with optional login/password used in some admin forms
declare module './admin-client' {
  interface Client {
    login?: string
    password?: string
    newPassword?: string
    generated_password?: string | null
  }
}

// Note: keep only the './admin-client' augmentation for compatibility
