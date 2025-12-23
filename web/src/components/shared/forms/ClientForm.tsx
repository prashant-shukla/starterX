import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../dialog';
import { Label } from '../label';
import { Input } from '../input';
import { Button } from '../button';
;
import { toNullIfEmpty, toNumberOrNull, isValidEmail } from '../../../utils/shared/helpers';
import * as apiClients from '../../../utils/api-client';
import { toast } from 'sonner';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: any) => void;
  accessToken?: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  signDate: string;
  accountNumber: string;
  routingNumber: string;
  monthly: string;
  catchUp: string;
  cfo: string;
  qbFee: string;
}

const initialFormData: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  signDate: '',
  accountNumber: '',
  routingNumber: '',
  monthly: '',
  catchUp: '',
  cfo: '',
  qbFee: '',
};

export function ClientForm({ isOpen, onClose, onClientCreated, accessToken }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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
      // Parse name into first/last
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        name: toNullIfEmpty(formData.name),
        first_name: toNullIfEmpty(firstName) || undefined,
        last_name: toNullIfEmpty(lastName) || undefined,
        email: toNullIfEmpty(formData.email),
        phone: toNullIfEmpty(formData.phone),
        address: toNullIfEmpty(formData.address),
        sign_date: toNullIfEmpty(formData.signDate),
        account_number: toNullIfEmpty(formData.accountNumber),
        routing_number: toNullIfEmpty(formData.routingNumber),
        monthly_fee: toNumberOrNull(formData.monthly),
        catchup_fee: toNumberOrNull(formData.catchUp),
        cfo_fee: toNumberOrNull(formData.cfo),
        qb_fee: toNumberOrNull(formData.qbFee),
      };

      
      
      const created = await apiClients.createClient(payload, accessToken).catch((error) => {
        throw error; // Re-throw to be caught by outer try-catch
      });

      if (created) {
        setSubmitError(null); // Clear any previous errors
        toast.success('Client created successfully!', {
          description: `${firstName || 'Client'} has been added.`
        });
        onClientCreated(created);
        handleClose();
      } else {
        // Don't throw generic error, let the API error be handled by the catch block
      }
    } catch (error: any) {
      
      
      // Set error message to display in modal - extract real API error
      let errorMessage = 'Failed to create client. Please try again.';
      
      console.log('Full error object for debugging:', JSON.stringify(error, null, 2));
      
      // Try to extract the actual API error message from various sources
      // Priority: Backend API error format first, then other sources
      if (error?.error) {
        errorMessage = error.error;
        console.log('Using error.error (backend API format):', errorMessage);
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        console.log('Using error.response.data.error:', errorMessage);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.log('Using error.response.data.message:', errorMessage);
      } else if (error?.response?.error) {
        errorMessage = error.response.error;
        console.log('Using error.response.error:', errorMessage);
      } else if (error?.response?.message) {
        errorMessage = error.response.message;
        console.log('Using error.response.message:', errorMessage);
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
        console.log('Using error.data.error:', errorMessage);
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
        console.log('Using error.data.message:', errorMessage);
      } else if (error?.message) {
        errorMessage = error.message;
        console.log('Using error.message:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.log('Using string error:', errorMessage);
      } else {
        // Try to extract from the error message string
        const messageStr = error?.message?.toString() || '';
        if (messageStr.includes('Request failed:') || messageStr.includes('error:')) {
          errorMessage = messageStr;
          console.log('Using parsed error message:', errorMessage);
        }
      }
      
      console.log('Setting submitError to:', errorMessage);
      setSubmitError(errorMessage);
      
      // Also try to show toast notification as backup
      try {
        toast.error('Failed to create client', {
          description: errorMessage,
          duration: 5000
        });
      } catch (toastError) {
        console.log('Toast notification failed:', toastError);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
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
                <h3 className="text-sm font-medium text-red-800">Error creating client</h3>
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


        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@acme.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="signDate">Sign Date</Label>
                <Input
                  id="signDate"
                  type="date"
                  value={formData.signDate}
                  onChange={(e) => handleInputChange('signDate', e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="123456789"
                />
              </div>

              <div>
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={formData.routingNumber}
                  onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                  placeholder="021000021"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly">Monthly Fee</Label>
                <Input
                  id="monthly"
                  type="number"
                  step="0.01"
                  value={formData.monthly}
                  onChange={(e) => handleInputChange('monthly', e.target.value)}
                  placeholder="500"
                />
              </div>

              <div>
                <Label htmlFor="catchUp">Catch-up Fee</Label>
                <Input
                  id="catchUp"
                  type="number"
                  step="0.01"
                  value={formData.catchUp}
                  onChange={(e) => handleInputChange('catchUp', e.target.value)}
                  placeholder="300"
                />
              </div>

              <div>
                <Label htmlFor="cfo">CFO Fee</Label>
                <Input
                  id="cfo"
                  type="number"
                  step="0.01"
                  value={formData.cfo}
                  onChange={(e) => handleInputChange('cfo', e.target.value)}
                  placeholder="200"
                />
              </div>

              <div>
                <Label htmlFor="qbFee">QuickBooks Fee</Label>
                <Input
                  id="qbFee"
                  type="number"
                  step="0.01"
                  value={formData.qbFee}
                  onChange={(e) => handleInputChange('qbFee', e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

