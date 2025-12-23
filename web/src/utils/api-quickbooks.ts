import { apiRequest } from './api';

// Determine the backend URL based on environment
const getBackendUrl = () => {
  // In production, use relative path (Vercel will proxy it)
  // In local dev, use explicit backend URL
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
};

/**
 * Get the OAuth authorization URL from backend
 * This endpoint is public and does not require authentication
 */
export const getQuickBooksAuthorizeUrl = async () => {
  try {
    const backendUrl = getBackendUrl();
    const url = backendUrl ? `${backendUrl}/integrations/quickbooks/authorize-url` : '/integrations/quickbooks/authorize-url';

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.authorize_url;
  } catch (error) {
    console.error('Error fetching QB authorize URL:', error);
    throw error;
  }
};

/**
 * Get list of companies from QuickBooks
 * Called with the tokens received from the OAuth callback
 */
export const getQuickBooksCompanies = async (accessToken: string, realmId: string, authToken?: string) => {
  try {
    const response = await apiRequest('/integrations/quickbooks/companies', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        realm_id: realmId,
      }),
    });
    return response?.data;
  } catch (error) {
    console.error('Error fetching QB companies:', error);
    throw error;
  }
};

/**
 * Get transactions from QuickBooks
 */
export const getQuickBooksTransactions = async (
  accessToken: string,
  realmId: string,
  transactionType: string = 'Invoice',
  maxResults: number = 10,
  authToken?: string
) => {
  try {
    const response = await apiRequest('/integrations/quickbooks/transactions', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        realm_id: realmId,
        transaction_type: transactionType,
        max_results: maxResults,
      }),
    });
    return response?.data;
  } catch (error: any) {
    // Only log errors that aren't "transaction type not found"
    if (!error?.message?.includes('not found') && !error?.statusCode === 404) {
      console.error(`Error fetching QB ${transactionType} transactions:`, error?.message || error);
    }
    throw error;
  }
};

/**
 * Get only uncategorized transactions from QuickBooks (server filters by splits)
 * Now uses company_id to fetch fresh tokens from server instead of passing stale tokens
 */
export const getQuickBooksUncategorized = async (
  companyId: string,
  maxResults: number = 100,
  authToken?: string
) => {
  try {
    const response = await apiRequest('/integrations/quickbooks/transactions/uncategorized', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        max_results: maxResults,
      }),
    });
    return response?.data;
  } catch (error) {
    console.error('Error fetching QB uncategorized transactions:', error);
    throw error;
  }
};

/**
 * Get transactions without payees from QuickBooks (server filters by missing payee refs)
 */
export const getQuickBooksWithoutPayees = async (
  companyId: string,
  maxResults: number = 10000,
  authToken?: string
) => {
  try {
    const response = await apiRequest('/integrations/quickbooks/transactions/without-payees', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        max_results: maxResults,
      }),
    });
    return response?.data;
  } catch (error) {
    console.error('Error fetching QB transactions without payees:', error);
    throw error;
  }
};

// Combined fetch: returns both uncategorized and without-payees in one call
export const getQuickBooksIssues = async (
  companyId: string,
  maxResults: number = 10000,
  authToken?: string
) => {
  const response = await apiRequest('/integrations/quickbooks/transactions/issues', {
    method: 'POST',
    headers: authToken
      ? { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id: companyId, max_results: maxResults })
  });
  return response?.data;
};

/**
 * Get bank accounts from QuickBooks
 */
export const getQuickBooksBankAccounts = async (
  companyId: string,
  authToken?: string
) => {
  try {
    const response = await apiRequest('/integrations/quickbooks/bank-accounts', {
      method: 'POST',
      headers: authToken
        ? { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId })
    });
    return response?.data;
  } catch (error) {
    console.error('Error fetching QB bank accounts:', error);
    throw error;
  }
};

/**
 * Check QuickBooks integration health
 */
export const checkQuickBooksHealth = async () => {
  try {
    const response = await apiRequest('/integrations/quickbooks/health', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    console.error('Error checking QB health:', error);
    throw error;
  }
};

/**
 * Save QB connection to company in database
 * Uses direct fetch since this is a public endpoint
 */
export const saveQBConnection = async (
  companyId: string,
  accessToken: string,
  refreshToken: string,
  realmId: string,
  companyName: string
) => {
  try {
    const backendUrl = getBackendUrl();
    const url = backendUrl ? `${backendUrl}/integrations/quickbooks/save-connection` : '/integrations/quickbooks/save-connection';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        access_token: accessToken,
        refresh_token: refreshToken,
        realm_id: realmId,
        company_name: companyName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data;
  } catch (error) {
    console.error('Error saving QB connection:', error);
    throw error;
  }
};

/**
 * Get QB connection for a company
 * Uses direct fetch since this is a public endpoint
 */
export const getQBConnection = async (companyId: string) => {
  try {
    const backendUrl = getBackendUrl();
    const url = backendUrl ? `${backendUrl}/integrations/quickbooks/get-connection` : '/integrations/quickbooks/get-connection';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data;
  } catch (error) {
    console.error('Error getting QB connection:', error);
    throw error;
  }
};

/**
 * Disconnect QB from company
 * Uses direct fetch since this is a public endpoint
 */
export const disconnectQB = async (companyId: string) => {
  try {
    const backendUrl = getBackendUrl();
    const url = backendUrl ? `${backendUrl}/integrations/quickbooks/disconnect` : '/integrations/quickbooks/disconnect';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data;
  } catch (error) {
    console.error('Error disconnecting QB:', error);
    throw error;
  }
};

/**
 * Refresh QuickBooks access token
 * Uses direct fetch since this is a public endpoint
 */
export const refreshQBToken = async (companyId: string) => {
  try {
    const backendUrl = getBackendUrl();
    const url = backendUrl ? `${backendUrl}/integrations/quickbooks/refresh-token` : '/integrations/quickbooks/refresh-token';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data?.data;
  } catch (error) {
    console.error('Error refreshing QB token:', error);
    throw error;
  }
};
