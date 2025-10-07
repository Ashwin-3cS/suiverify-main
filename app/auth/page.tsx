'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import accessControl from '../../access-control.json';

interface AuthResult {
  success: boolean;
  user?: { username: string; role: string };
  error?: string;
}

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const authData = localStorage.getItem('suiverify_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const now = Date.now();
        const sessionAge = now - parsed.timestamp;

        if (sessionAge < accessControl.config.sessionTimeout) {
          // Valid session, redirect to dashboard
          router.push('/dashboard');
          return;
        } else {
          // Session expired
          localStorage.removeItem('suiverify_auth');
        }
      } catch {
        localStorage.removeItem('suiverify_auth');
      }
    }

    // Get login attempts from localStorage
    const attempts = localStorage.getItem('suiverify_login_attempts');
    if (attempts) {
      setLoginAttempts(parseInt(attempts, 10));
    }
  }, [router]);

  const authenticate = (username: string, password: string): AuthResult => {
    // Check login attempts
    if (loginAttempts >= accessControl.config.maxLoginAttempts) {
      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.'
      };
    }

    // Find user in access control
    const user = accessControl.users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('suiverify_login_attempts', newAttempts.toString());
      
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Reset login attempts on successful login
    setLoginAttempts(0);
    localStorage.removeItem('suiverify_login_attempts');

    // Store auth session
    const authData = {
      username: user.username,
      role: user.role,
      timestamp: Date.now()
    };

    localStorage.setItem('suiverify_auth', JSON.stringify(authData));

    return {
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = authenticate(username, password);
      
      if (result.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = loginAttempts >= accessControl.config.maxLoginAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#030f1c' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4"
        style={{ backgroundColor: '#011829', border: '2px solid #4DA2FF' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-2"
            style={{ color: '#ffffff' }}
          >
            <span style={{ color: '#4DA2FF' }}>Sui</span>Verify
          </motion.h1>
          <p className="text-sm" style={{ color: '#c0e6ff' }}>
            Enter your credentials to access the dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: '#c0e6ff' }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#030f1c',
                borderColor: '#4DA2FF40',
                color: '#ffffff'
              }}
              placeholder="Enter your username"
              required
              disabled={isLoading || isBlocked}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#c0e6ff' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#030f1c',
                borderColor: '#4DA2FF40',
                color: '#ffffff'
              }}
              placeholder="Enter your password"
              required
              disabled={isLoading || isBlocked}
            />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: '#fee2e2',
                borderColor: '#fecaca',
                color: '#dc2626'
              }}
            >
              <p className="text-sm">{error}</p>
              {!isBlocked && loginAttempts > 0 && (
                <p className="text-xs mt-1">
                  Attempts: {loginAttempts}/{accessControl.config.maxLoginAttempts}
                </p>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            type="submit"
            disabled={isLoading || isBlocked}
            whileHover={{ scale: isLoading || isBlocked ? 1 : 1.02 }}
            whileTap={{ scale: isLoading || isBlocked ? 1 : 0.98 }}
            className="w-full font-bold px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isLoading || isBlocked ? '#4DA2FF80' : '#4DA2FF',
              color: '#ffffff',
              border: '2px solid #4DA2FF'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Authenticating...</span>
              </div>
            ) : isBlocked ? (
              'Too Many Attempts'
            ) : (
              'Access Dashboard'
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-6 mt-6 border-t"
          style={{ borderColor: '#4DA2FF40' }}
        >
          <p className="text-xs" style={{ color: '#c0e6ffCC' }}>
            Don&apos;t have access? <a href="https://suiverify.xyz" className="underline" style={{ color: '#4DA2FF' }}>Request access</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
