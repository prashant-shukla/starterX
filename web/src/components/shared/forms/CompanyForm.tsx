import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../dialog';
import { Label } from '../label';
import { Input } from '../input';
import { Button } from '../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { toNullIfEmpty } from '../../../utils/shared/helpers';
import * as apiClients from '../../../utils/api-client';
import { toast } from 'sonner';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: any) => void;
  accessToken?: string;
}

interface CompanyFormData {
  clientId: string;
  name: string;
  industry: string;
  manager: string;
  assigned: string;
}

interface User {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const initialFormData: CompanyFormData = {
  clientId: '',
  name: '',
  industry: 'Trucking',
  manager: '',
  assigned: '',
};

export function CompanyForm({ isOpen, onClose, onCompanyCreated, accessToken }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientUsers, setClientUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [contractors, setContractors] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingContractors, setLoadingContractors] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    if (isOpen && accessToken) {
      loadClientUsers();
      loadManagers();
      loadContractors();
    }
  }, [isOpen, accessToken]);

  const loadClientUsers = async () => {
    setLoadingUsers(true);
    try {
      // Prefer dedicated helper which may apply caching/normalization
      const usersPrimary = await apiClients.getClientUsers(accessToken);
      let users = Array.isArray(usersPrimary) ? usersPrimary : [];

      // Fallback: query generic users endpoint and filter role=client
      if (users.length === 0) {
        const { apiRequest } = await import('../../../utils/api');
        const resAll = await apiRequest('/users', {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
        });
        const allUsers = resAll?.users || resAll?.data || [];
        users = (Array.isArray(allUsers) ? allUsers : []).filter((u: any) => {
          const role = String(u.role || '').toLowerCase();
          return role === 'client' && (u.is_active !== false);
        });
      }

      // Normalize label fields to ensure display
      const normalized = users.map((u: any) => ({
        ...u,
        name: u.name || `${(u.first_name || u.firstName || '').toString().trim()} ${
          (u.last_name || u.lastName || '').toString().trim()}`.trim()
      }));

      setClientUsers(normalized);

      if (!normalized || normalized.length === 0) {
        console.warn('No client users available for selection');
      }
    } catch (error) {
      console.error('Failed to load client users:', error);
      toast.error('Failed to load client users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      const users = await apiClients.getManagers(accessToken);
      setManagers(users);
    } catch (error) {
      console.error('Failed to load managers:', error);
      toast.error('Failed to load managers');
    } finally {
      setLoadingManagers(false);
    }
  };

  const loadContractors = async () => {
    setLoadingContractors(true);
    try {
      const users = await apiClients.getBookkeepers(accessToken);
      setContractors(users);
    } catch (error) {
      console.error('Failed to load bookkeepers:', error);
      toast.error('Failed to load bookkeepers');
    } finally {
      setLoadingContractors(false);
    }
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null); // Clear any previous errors

    // Add global error handler for debugging
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0]?.includes?.('clients') || args[0]?.includes?.('company') || args[0]?.includes?.('500')) {
        console.log('API Error detected:', args);
        // Try to extract error message from console args
        let errorMessage = 'Unknown error occurred';
        
        // Try to extract meaningful error from console args
        if (args[0] && typeof args[0] === 'object') {
          if (args[0].error) {
            errorMessage = args[0].error;
          } else if (args[0].message) {
            errorMessage = args[0].message;
          } else if (args[0].response?.data?.error) {
            errorMessage = args[0].response.data.error;
          } else if (args[0].response?.data?.message) {
            errorMessage = args[0].response.data.message;
          }
        } else if (args[0]) {
          errorMessage = args[0].toString();
        }
        
        console.log('Setting error from console:', errorMessage);
        setSubmitError(errorMessage);
      }
    };

    // Add unhandled promise rejection handler
    const handleUnhandledRejection = (event: any) => {
      console.log('Unhandled promise rejection:', event);
      let errorMessage = 'Unknown promise rejection error';
      
      if (event.reason) {
        // Use same priority order as main error handler
        if (event.reason.error) {
          errorMessage = event.reason.error;
        } else if (event.reason.response?.data?.error) {
          errorMessage = event.reason.response.data.error;
        } else if (event.reason.response?.data?.message) {
          errorMessage = event.reason.response.data.message;
        } else if (event.reason.response?.error) {
          errorMessage = event.reason.response.error;
        } else if (event.reason.response?.message) {
          errorMessage = event.reason.response.message;
        } else if (event.reason.data?.error) {
          errorMessage = event.reason.data.error;
        } else if (event.reason.data?.message) {
          errorMessage = event.reason.data.message;
        } else if (event.reason.message) {
          errorMessage = event.reason.message;
        } else if (typeof event.reason === 'string') {
          errorMessage = event.reason;
        }
      }
      
      console.log('Setting error from unhandled rejection:', errorMessage);
      setSubmitError(errorMessage);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Add global error handler
    const handleGlobalError = (event: any) => {
      console.log('Global error:', event);
      let errorMessage = 'Unknown global error';
      
      if (event.error) {
        // Use same priority order as main error handler
        if (event.error.error) {
          errorMessage = event.error.error;
        } else if (event.error.response?.data?.error) {
          errorMessage = event.error.response.data.error;
        } else if (event.error.response?.data?.message) {
          errorMessage = event.error.response.data.message;
        } else if (event.error.response?.error) {
          errorMessage = event.error.response.error;
        } else if (event.error.response?.message) {
          errorMessage = event.error.response.message;
        } else if (event.error.data?.error) {
          errorMessage = event.error.data.error;
        } else if (event.error.data?.message) {
          errorMessage = event.error.data.message;
        } else if (event.error.message) {
          errorMessage = event.error.message;
        } else if (typeof event.error === 'string') {
          errorMessage = event.error;
        }
      }
      
      console.log('Setting error from global error:', errorMessage);
      setSubmitError(errorMessage);
    };

    window.addEventListener('error', handleGlobalError);
    
    try {
      const payload = {
        client_id: formData.clientId,
        name: toNullIfEmpty(formData.name) || undefined,
        industry: toNullIfEmpty(formData.industry) || 'Trucking',
        assigned_contractor_id: formData.assigned || null,
        assigned_manager_id: formData.manager || null,
      };

      const created = await apiClients.createCompany(payload, accessToken).catch((error) => {
        throw error; // Re-throw to be caught by outer try-catch
      });

      if (created) {
        setSubmitError(null); // Clear any previous errors
        toast.success('Company created successfully!', {
          description: `${formData.name} has been added to the selected client.`
        });
        onCompanyCreated(created);
        handleClose();
      } else {
        // Don't throw generic error, let the API error be handled by the catch block
      }
    } catch (error: any) {
      console.error('Failed to create company:', error);
      
      // Set error message to display in modal - extract real API error
      let errorMessage = 'Failed to create company. Please try again.';
      
      
      // Try to extract the actual API error message from various sources
      // Priority: Backend API error format first, then other sources
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.error) {
        errorMessage = error.response.error;
      } else if (error?.response?.message) {
        errorMessage = error.response.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // Try to extract from the error message string
        const messageStr = error?.message?.toString() || '';
        if (messageStr.includes('Request failed:') || messageStr.includes('error:')) {
          errorMessage = messageStr;
        }
      }
      setSubmitError(errorMessage);
      
      // Also try to show toast notification as backup
      try {
        toast.error('Failed to create company', {
          description: errorMessage,
          duration: 5000
        });
      } catch (toastError) {
        console.error('Toast notification failed:', toastError);
      }
      
      setErrors({ name: errorMessage });
    } finally {
      // Clean up event listeners and restore original console.error
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
      console.error = originalConsoleError;
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add New Company
          </DialogTitle>
        </DialogHeader>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error creating company</h3>
                <div className="mt-2 text-sm text-red-700">
                  {submitError}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => handleInputChange('clientId', value)}
                >
                  <SelectTrigger className={errors.clientId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={loadingUsers ? "Loading clients..." : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUsers.map((user) => {
                      const displayName = (user.name && String(user.name).trim().length > 0)
                        ? user.name
                        : `${(user.first_name || user.firstName || '')} ${(user.last_name || user.lastName || '')}`.trim() || user.email;
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {displayName} ({user.email})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Acme Corp"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="Trucking"
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manager">Manager</Label>
                <Select value={formData.manager} onValueChange={(value) => handleInputChange('manager', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingManagers ? "Loading managers..." : "Select manager"} />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned">Assigned Bookkeeper</Label>
                <Select value={formData.assigned} onValueChange={(value) => handleInputChange('assigned', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingContractors ? "Loading bookkeepers..." : "Select bookkeeper"} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
