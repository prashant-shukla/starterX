import { useEffect, useState } from 'react'
import { Button } from './shared/button'
import { CheckCircle, Code, Database, Shield, Zap, ArrowRight, Sparkles, Server, Lock, Users, FileText, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/api';

interface HomePageProps {
  onLoginClick?: () => void;
}

export function HomePage({ onLoginClick }: HomePageProps) {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/login');
    }
  };
  
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 my-2">
            <a href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">Full-Stack Boilerplate</span>
            </a>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#tech-stack" className="text-gray-600 hover:text-gray-900 transition-colors">Tech Stack</a>
              <a href="#getting-started" className="text-gray-600 hover:text-gray-900 transition-colors">Getting Started</a>
            </nav>
            <div className="flex items-center space-x-4">
              {accessToken && user ? (
                <Button 
                  variant="ghost" 
                  onClick={handleDashboardClick}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={handleLoginClick}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Login
                </Button>
              )}
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white hidden md:flex items-center" 
                onClick={handleLoginClick}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="hero"
        data-animate
        className={`bg-gradient-to-br from-blue-50 to-white pt-20 pb-20 relative overflow-hidden transition-all duration-1000 ease-out ${
          isVisible['hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Production-Ready{" "}
            <span className="text-blue-600">
              Full-Stack Boilerplate
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            A clean, modern starter template with NestJS backend and React/Vite frontend. 
            Includes authentication, database setup, and all the essentials to build your next application.
          </p>
          
          <div className="mb-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button 
              size="lg" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-2"
              onClick={handleLoginClick}
            >
              Try Demo
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold"
              onClick={() => navigate('/login')}
            >
              View Documentation
            </Button>
          </div>

          <div className="flex flex-row gap-3 sm:gap-8 justify-center text-xs sm:text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="whitespace-nowrap">JWT Authentication</span>
            </div>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="whitespace-nowrap">PostgreSQL Ready</span>
            </div>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <span className="whitespace-nowrap">TypeScript</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        data-animate
        className={`py-20 bg-white transition-all duration-1000 ease-out ${
          isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Get Started
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with best practices and modern tools. Start building your features right away.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">JWT Authentication</h3>
              <p className="text-gray-600">
                Secure user authentication with JWT tokens. Includes login, logout, and protected routes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Database Migrations</h3>
              <p className="text-gray-600">
                PostgreSQL database with migration system. Easy to extend and customize.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">TypeScript</h3>
              <p className="text-gray-600">
                Full TypeScript support for type safety and better developer experience.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">NestJS Backend</h3>
              <p className="text-gray-600">
                Scalable backend architecture with Swagger API documentation built-in.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">React + Vite</h3>
              <p className="text-gray-600">
                Fast frontend with React and Vite. Hot module replacement for instant updates.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-2xl border border-blue-100/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Security First</h3>
              <p className="text-gray-600">
                Built with security best practices. Protected routes and secure authentication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section 
        id="tech-stack" 
        className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Modern Tech Stack
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with industry-standard tools and frameworks
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Backend */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Backend</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>NestJS - Enterprise Node.js framework</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>PostgreSQL - Robust relational database</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>TypeScript - Type-safe development</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Swagger - API documentation</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>JWT - Secure authentication</span>
                </li>
              </ul>
            </div>

            {/* Frontend */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Frontend</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>React 18 - Modern UI library</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Vite - Lightning-fast build tool</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>TypeScript - Type safety</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>React Router - Client-side routing</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Tailwind CSS - Utility-first styling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section 
        id="getting-started" 
        className="py-20 bg-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Quick Start Guide
            </h2>
            <p className="text-lg text-gray-600">
              Get up and running in minutes
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 text-white font-mono text-sm overflow-x-auto">
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 mb-2"># 1. Install dependencies</p>
                <p className="text-green-400">cd api && npm install</p>
                <p className="text-green-400">cd web && npm install</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2"># 2. Setup environment</p>
                <p className="text-green-400">cp api/.env.example api/.env</p>
                <p className="text-green-400"># Edit api/.env with your database credentials</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2"># 3. Run migrations</p>
                <p className="text-green-400">cd api && npm run migrate</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2"># 4. Create demo user</p>
                <p className="text-green-400">cd api && npm run create-demo-user</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2"># 5. Start development servers</p>
                <p className="text-green-400">cd api && npm run start:dev</p>
                <p className="text-green-400">cd web && npm run dev</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              <strong>Demo Credentials:</strong>
            </p>
            <div className="bg-blue-50 rounded-lg p-4 inline-block">
              <p className="text-gray-900 font-mono">
                Email: <span className="text-blue-600">demo@example.com</span>
              </p>
              <p className="text-gray-900 font-mono">
                Password: <span className="text-blue-600">demo123</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Build Your Application?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start with a solid foundation. This boilerplate includes everything you need to build production-ready applications.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg text-lg font-medium inline-flex items-center gap-2"
              onClick={handleLoginClick}
            >
              Try Demo Now
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-semibold">Full-Stack Boilerplate</span>
              </div>
              <p className="text-gray-400 text-sm">
                A production-ready starter template for building modern web applications.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/eula" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Full-Stack Boilerplate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
