/**
 * Admin Client Helper Functions
 * Extracted from ClientDirectory.tsx for better organization
 */

/**
 * Generate a consistent color gradient based on name hash
 */
export const getColorFromName = (name: string): string => {
  const colors = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-emerald-500 to-emerald-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-orange-500 to-orange-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
    "bg-gradient-to-br from-red-500 to-red-600",
    "bg-gradient-to-br from-cyan-500 to-cyan-600",
    "bg-gradient-to-br from-amber-500 to-amber-600",
    "bg-gradient-to-br from-green-500 to-green-600",
    "bg-gradient-to-br from-violet-500 to-violet-600",
    "bg-gradient-to-br from-rose-500 to-rose-600",
    "bg-gradient-to-br from-sky-500 to-sky-600",
    "bg-gradient-to-br from-slate-500 to-slate-600",
  ];

  let hash = 0;
  const str = (name || '').toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = Math.abs(hash);
  }
  return colors[hash % colors.length];
};

/**
 * Get Tailwind color classes based on status
 */
export const getStatusColor = (status: string): string => {
  if (!status) return "bg-gray-50 text-gray-700 border-gray-200";

  const normalizedStatus = String(status).toLowerCase().trim();

  // Handle stage types (onboarding, catch_up/catch up, monthly)
  if (normalizedStatus === 'onboarding') {
    return "bg-blue-100 text-blue-700 border-blue-300";
  }
  if (normalizedStatus === 'catch up' || normalizedStatus === 'catch_up' || normalizedStatus === 'catchup') {
    return "bg-orange-100 text-orange-700 border-orange-300";
  }
  if (normalizedStatus === 'monthly') {
    return "bg-green-100 text-green-700 border-green-300";
  }

  // Handle other statuses
  const statusMap: Record<string, string> = {
    'done': "bg-green-50 text-green-700 border-green-200",
    'completed': "bg-green-50 text-green-700 border-green-200",
    'not started': "bg-gray-50 text-gray-700 border-gray-200",
    'not_started': "bg-gray-50 text-gray-700 border-gray-200",
    'in progress': "bg-yellow-50 text-yellow-700 border-yellow-200",
    'in_progress': "bg-yellow-50 text-yellow-700 border-yellow-200",
    'stuck': "bg-red-50 text-red-700 border-red-200",
    'on client': "bg-orange-50 text-orange-700 border-orange-200",
    'review': "bg-purple-50 text-purple-700 border-purple-200",
  };

  return statusMap[normalizedStatus] || "bg-gray-50 text-gray-700 border-gray-200";
};

/**
 * Convert DB stage status (snake_case) to display-friendly title case
 */
export const formatStageStatus = (s: any): string => {
  if (!s && s !== '') return ''
  const st = String(s || '').trim()
  if (!st) return ''

  const lower = st.toLowerCase()
  const statusMap: Record<string, string> = {
    'in_progress': 'In Progress',
    'in progress': 'In Progress',
    'not_started': 'Not Started',
    'not started': 'Not Started',
    'completed': 'Completed',
    'review': 'Review',
    'stuck': 'Stuck',
  };

  if (statusMap[lower]) return statusMap[lower];

  // Default: convert snake_case or space-separated to Title Case
  return st.split(/[_\s]+/).map((p: string) =>
    p.charAt(0).toUpperCase() + p.slice(1)
  ).join(' ');
};

/**
 * Get initials from name for avatar display
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getFirstName = (name?: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts[0] || '';
};

/**
 * Format currency value
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
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
  } catch {
    return dateString;
  }
};

/**
 * Calculate task completion percentage
 */
export const calculateCompletionPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize input to null if empty
 */
export const toNullIfEmpty = (value: any): any | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

/**
 * Convert string to number or null
 */
export const toNumberOrNull = (value: any): number | null => {
  const sanitized = toNullIfEmpty(value);
  if (sanitized === null) return null;
  const n = Number(sanitized);
  return Number.isNaN(n) ? null : n;
};

export interface CompanyRecordLike {
  name?: string;
  company_name?: string;
  client_name?: string;
}

export const hasValidCompanyRecord = (record?: CompanyRecordLike): boolean => {
  if (!record) return false;
  const companyName = (record.name || record.company_name || '').trim();
  if (!companyName) return false;
  const clientName = (record.client_name || '').trim();
  if (!clientName) return true;
  return companyName.toLowerCase() !== clientName.toLowerCase();
};

