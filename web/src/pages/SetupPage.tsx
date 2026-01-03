import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shared/button';
import { Input } from '../components/shared/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/shared/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Database, Key, User, Settings } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { toast } from 'sonner';

interface SetupStatus {
  installed: boolean;
  database: boolean;
  migrations: boolean;
  adminUser: boolean;
  envConfigured: boolean;
  errors: string[];
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [runningMigrations, setRunningMigrations] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: 'Admin',
    lastName: 'User',
  });

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await apiRequest('/setup/status');
      setStatus(response);
      if (response.installed) {
        toast.success('Application is already installed!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      toast.error('Failed to check installation status: ' + (error.message || 'Unknown error'));
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRunMigrations = async () => {
    setRunningMigrations(true);
    try {
      const response = await apiRequest('/setup/run-migrations', {
        method: 'POST',
      });
      if (response.success) {
        toast.success('Migrations completed successfully!');
        await checkStatus();
      }
    } catch (error: any) {
      toast.error('Failed to run migrations: ' + (error.message || 'Unknown error'));
    } finally {
      setRunningMigrations(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (adminForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingAdmin(true);
    try {
      const response = await apiRequest('/setup/create-admin', {
        method: 'POST',
        body: JSON.stringify(adminForm),
      });
      if (response.success) {
        toast.success('Admin user created successfully!');
        // Wait a moment for the database to update, then refresh status
        setTimeout(async () => {
          await checkStatus();
        }, 500);
        setAdminForm({ email: '', password: '', firstName: 'Admin', lastName: 'User' });
      }
    } catch (error: any) {
      toast.error('Failed to create admin user: ' + (error.message || 'Unknown error'));
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDebugUsers = async () => {
    setChecking(true);
    try {
      const response = await apiRequest('/setup/debug-users');
      if (response.success) {
        console.log('Users in database:', response.users);
        toast.success(`Found ${response.count} user(s). Check console for details.`);
        // Show users in an alert for quick debugging
        const userList = response.users.map((u: any) => 
          `- ${u.email} (role: "${u.role}")`
        ).join('\n');
        alert(`Users in database:\n\n${userList || 'No users found'}`);
      }
    } catch (error: any) {
      toast.error('Failed to fetch users: ' + (error.message || 'Unknown error'));
    } finally {
      setChecking(false);
    }
  };

  const handleTestDatabase = async () => {
    setChecking(true);
    try {
      const response = await apiRequest('/setup/test-database');
      if (response.success) {
        toast.success(`Database connection successful! Connected to: ${response.database}`);
      }
    } catch (error: any) {
      toast.error('Database connection failed: ' + (error.message || 'Unknown error'));
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking installation status...</p>
        </div>
      </div>
    );
  }

  if (status?.installed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Installation Complete!</h2>
              <p className="text-gray-600 mb-6">Your application is ready to use.</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Setup</h1>
          <p className="text-gray-600">Let's get your application up and running</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Installation Status
              </CardTitle>
              <CardDescription>Current installation progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusItem
                label="Database Connection"
                status={status?.database}
                icon={<Database className="h-4 w-4" />}
              />
              <StatusItem
                label="Database Migrations"
                status={status?.migrations}
                icon={<Database className="h-4 w-4" />}
              />
              <StatusItem
                label="Environment Variables"
                status={status?.envConfigured}
                icon={<Key className="h-4 w-4" />}
              />
              <StatusItem
                label="Admin User"
                status={status?.adminUser}
                icon={<User className="h-4 w-4" />}
              />

              {status?.errors && status.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">Issues Found:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {status.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {status?.migrations && !status?.adminUser && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        No admin user found. Create one in the Setup Actions panel.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={checkStatus}
                  disabled={checking}
                  variant="outline"
                  className="flex-1"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    'Refresh Status'
                  )}
                </Button>
                <Button
                  onClick={handleTestDatabase}
                  disabled={checking}
                  variant="outline"
                  className="flex-1"
                >
                  Test Database
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleDebugUsers}
                  disabled={checking}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Debug: Check Users
                </Button>
                <Button
                  onClick={async () => {
                    setChecking(true);
                    try {
                      const response = await apiRequest('/setup/debug-connection');
                      console.log('Connection debug:', response);
                      if (response.success) {
                        toast.success('Connection OK! Check console for details.');
                        alert(`Connection Info:\n\n${JSON.stringify(response, null, 2)}`);
                      } else {
                        toast.error('Connection failed. Check console for details.');
                        alert(`Connection Error:\n\n${JSON.stringify(response, null, 2)}`);
                      }
                    } catch (error: any) {
                      toast.error('Failed to debug connection: ' + (error.message || 'Unknown error'));
                    } finally {
                      setChecking(false);
                    }
                  }}
                  disabled={checking}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Debug: Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Actions</CardTitle>
              <CardDescription>Complete the installation steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Run Migrations */}
              <div>
                <h3 className="font-medium mb-2">1. Run Database Migrations</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Set up your database schema by running migrations.
                </p>
                <Button
                  onClick={handleRunMigrations}
                  disabled={runningMigrations || status?.migrations}
                  className="w-full"
                >
                  {runningMigrations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Running Migrations...
                    </>
                  ) : status?.migrations ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Migrations Complete
                    </>
                  ) : (
                    'Run Migrations'
                  )}
                </Button>
              </div>

              {/* Create Admin User */}
              <div>
                <h3 className="font-medium mb-2">2. Create Admin User</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create your first admin account to access the application.
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="First Name"
                      value={adminForm.firstName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, firstName: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Last Name"
                      value={adminForm.lastName}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, lastName: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                  />
                  <Button
                    onClick={handleCreateAdmin}
                    disabled={creatingAdmin || status?.adminUser}
                    className="w-full"
                  >
                    {creatingAdmin ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : status?.adminUser ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Admin User Exists
                      </>
                    ) : (
                      'Create Admin User'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Before starting:</strong> Make sure you have:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>PostgreSQL database running and accessible</li>
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded">DATABASE_URL</code> environment
                  variable set in <code className="bg-gray-100 px-1 py-0.5 rounded">api/.env</code>
                </li>
                <li>
                  <code className="bg-gray-100 px-1 py-0.5 rounded">JWT_SECRET</code> environment
                  variable set in <code className="bg-gray-100 px-1 py-0.5 rounded">api/.env</code>
                </li>
              </ul>
              <p className="pt-2">
                If you haven't set up your environment variables yet, please create an{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">api/.env</code> file with the
                required configuration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
  icon,
}: {
  label: string;
  status?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {status === undefined ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : status ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );
}

