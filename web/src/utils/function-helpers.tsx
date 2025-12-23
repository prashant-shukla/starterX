import { 
  ClipboardList,
  UserCheck,
  FileText,
  FileCheck,
  CreditCard,
  Folder,
  TrendingUp,
  CheckCircle2,
  Calendar,
  StickyNote
} from 'lucide-react'
import { Send, Calculator, Sparkles } from 'lucide-react'
import React from 'react'

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  // Check if it's a date-only string (YYYY-MM-DD format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Parse manually without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // For full ISO timestamps or other formats, use normal Date parsing
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-50 text-green-700 border-green-200'
    case 'Onboarding': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Catch Up': return 'bg-red-50 text-red-700 border-red-200'
    case 'Paid': return 'bg-green-50 text-green-700 border-green-200'
    case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'Issues': return 'bg-red-50 text-red-700 border-red-200'
    case 'On Client': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'In Progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'Pending Review': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'Completed': return 'bg-green-50 text-green-700 border-green-200'
    case 'On Hold': return 'bg-gray-50 text-gray-700 border-gray-200'
    case 'Needs Attention': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export const maskAccountNumber = (accountNumber: string, showAccountNumber: boolean) => {
  if (showAccountNumber) return accountNumber
  return accountNumber.replace(/^(.{3}).*(.{3})$/, '$1****$2')
}

export const parseTransactionText = (text: string) => {
  // Extract date (MM/DD/YYYY format)
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US');

  // Extract amount ($XXX.XX format)
  const amountMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

  // Determine transaction type based on keywords
  let type = 'General';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('received') || lowerText.includes('deposit') || lowerText.includes('credit')) {
    type = 'Income';
  } else if (lowerText.includes('payment') || lowerText.includes('debit') || lowerText.includes('withdraw')) {
    type = 'Expense';
  } else if (lowerText.includes('zelle') || lowerText.includes('transfer')) {
    type = 'Transfer';
  } else if (lowerText.includes('fuel') || lowerText.includes('gas')) {
    type = 'Fuel Expense';
  } else if (lowerText.includes('maintenance') || lowerText.includes('repair')) {
    type = 'Maintenance';
  }

  // Determine account based on keywords
  let account = 'General';
  if (lowerText.includes('fuel') || lowerText.includes('gas')) {
    account = 'Fuel Expenses';
  } else if (lowerText.includes('maintenance') || lowerText.includes('repair')) {
    account = 'Maintenance';
  } else if (lowerText.includes('received') || lowerText.includes('income')) {
    account = 'Income';
  } else if (lowerText.includes('zelle') || lowerText.includes('transfer')) {
    account = 'Bank Transfer';
  }

  // Create description by removing date and cleaning up
  let description = text.replace(/\d{1,2}\/\d{1,2}\/\d{4}/, '').trim();
  description = description.replace(/^\s*-?\s*/, ''); // Remove leading dashes/spaces
  
  return {
    date: formatDateForInput(date),
    description,
    type,
    account,
    amount
  };
};

export const formatDateForInput = (dateString: string) => {
  // Convert MM/DD/YYYY to YYYY-MM-DD for input type="date"
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
};

export const formatDateForEdit = (dateString: string) => {
  // Convert various date formats to YYYY-MM-DD for input type="date"
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return dateString.includes('-') ? dateString : new Date().toISOString().split('T')[0];
};

export const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'responded': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'not started': return 'bg-gray-100 text-gray-800';
    case 'in progress': return 'bg-blue-100 text-blue-800';
    case 'on hold': return 'bg-orange-100 text-orange-800';
    case 'needs attention': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatTaskDisplayName = (taskKey: string) => {
  // Convert camelCase to Title Case
  return taskKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export const formatTaskName = (taskKey: string, task?: any) => {
  if (task && task.customName) {
    return task.customName;
  }
  return formatTaskDisplayName(taskKey);
};

export const getTaskIcon = (taskKey: string) => {
  switch (taskKey) {
    case 'setup': return ClipboardList;
    case 'accountsIntegrations': return UserCheck;
    case 'documentsCollection': return FileText;
    case 'review': return FileCheck;
    case 'bankAccountSetup': return CreditCard;
    case 'documentGathering': return Folder;
    case 'transactionProcessing': return TrendingUp;
    case 'reconciliationAdjustments': return CheckCircle2;
    case 'reviewFinalization': return FileCheck;
    case 'dueDate': return Calendar;
    case 'generalTasks': return ClipboardList;
    case 'categorization': return StickyNote;
    case 'reconciliation': return CheckCircle2;
    case 'reviewTask': return FileCheck;
    default: return ClipboardList;
  }
};

export const formatAddressWithoutZip = (address: string) => {
  // Remove zip code from address for display
  return address.replace(/\s+\d{5}(-\d{4})?$/, '');
};

export const getTaskSummary = (tasks: any) => {
  if (!tasks || typeof tasks !== 'object') {
    return 'No tasks available';
  }
  
  const taskValues = Object.values(tasks);
  const totalTasks = taskValues.length;
  const completedTasks = taskValues.filter((task: any) => task && task.completed === true).length;
  
  return `${completedTasks}/${totalTasks} completed`;
};

export const formatPeriodDisplay = (month: string | undefined | null, year: string | undefined | null) => {
  if (!month || !year) {
    return 'Not set';
  }
  try {
    return `${month} ${year}`;
  } catch (error) {
    console.error('Error formatting period display:', error);
    return 'Invalid period';
  }
};

export const formatPeriodDisplayShort = (month: string | undefined | null, year: string | undefined | null) => {
  if (!month || !year) {
    return 'Not set';
  }
  try {
    const shortMonth = month.substring(0, 3);
    const shortYear = year.substring(2);
    return `${shortMonth}'${shortYear}`;
  } catch (error) {
    console.error('Error formatting period display short:', error);
    return 'Invalid period';
  }
};

// -----------------------------------------------------------------------------
// Backwards-compatible small constants/types used by components that previously
// imported from `utils/client-data`. We keep them here to avoid creating new
// utility files; components can import these symbols from `function-helpers`.
// -----------------------------------------------------------------------------

export const MANAGER_OPTIONS: string[] = [
  'Sarah Johnson',
  'Mike Chen',
  'Unassigned'
]

export const CURRENT_STAGE_OPTIONS: string[] = [
  'Not Started',
  'In Progress',
  'Review',
  'Completed'
]

export interface OnboardingClient {
  id: string
  name: string
  firstName?: string
  lastName?: string
  joined?: string
  clientSetup?: { completed: number; total: number }
  accountsIntegrations?: { completed: number; total: number }
  documentsCollection?: { completed: number; total: number }
  review?: { completed: number; total: number }
  status?: string
  manager?: string
}

export type QuickAction = {
  query: string
  label: string
  icon: React.ComponentType<any>
}

export const CLIENT_QUICK_ACTIONS: QuickAction[] = [
  {
    query: 'What is the current status of my business operations, financials, and any pending items that need my attention?',
    label: 'Business overview',
    icon: FileText
  },
  {
    query: 'What are my biggest cost increases lately and what should I do to manage them better?',
    label: 'Cost trends & control',
    icon: TrendingUp
  },
  {
    query: 'Which customers might pay late and how can I improve my cash flow?',
    label: 'Cash flow & collections',
    icon: CreditCard
  },
  {
    query: 'Am I meeting my financial goals this quarter and what can I do to improve performance?',
    label: 'Performance check-in',
    icon: CheckCircle2
  }
]

export interface QuestionShape {
  id: number
  date: string
  description: string
  type: string
  account?: string
  amount?: number
  status: 'open' | 'responded' | 'completed'
  assigned?: string
}

export const initialOpenQuestions: QuestionShape[] = []
export const initialRespondedQuestions: QuestionShape[] = []
export const initialCompletedQuestions: QuestionShape[] = []