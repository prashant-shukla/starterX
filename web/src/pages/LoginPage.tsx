import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth, apiRequest } from '../utils/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { accessToken, user, isLoading, setToken, setUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && accessToken && user) {
      const role = user?.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'manager') {
        navigate('/manager', { replace: true });
      } else if (role === 'contractor' || role === 'bookkeeper') {
        navigate('/contractor', { replace: true });
      } else {
        navigate('/client', { replace: true });
      }
    }
  }, [isLoading, accessToken, user, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!data || !data.access_token) {
        throw new Error('Authentication failed - please try again');
      }

      setToken(data.access_token);
      setUser(data.user);
      
      // Determine user type and redirect
      const role = data.user?.user_metadata?.role;
      const isAdmin = role === 'admin' || email.includes('admin@synoro.com');
      const isManager = role === 'manager' || email.includes('manager@synoro.com');
      const isContractor = role === 'contractor' || role === 'bookkeeper' || 
                          email.includes('contractor@synoro.com') || email.includes('bookkeeper');
      
      
      // Navigate to appropriate dashboard
      if (isAdmin) {
        navigate('/admin');
      } else if (isManager) {
        navigate('/manager');
      } else if (isContractor) {
        navigate('/contractor');
      } else {
        navigate('/client');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed - please try again'
      };
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return <LoginForm onLogin={handleLogin} onBackToHome={handleBackToHome} />;
}

