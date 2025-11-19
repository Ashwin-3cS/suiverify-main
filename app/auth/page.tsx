'use client';

import type { Metadata } from "next";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { colors } from '@/app/brand';
import accessControlData from '@/access-control.json';
import { Button } from '@/components/ui/button';

interface AuthResult {
  success: boolean;
  user?: { name: string; role: string };
  error?: string;
}

// Authentication function using the JSON data
const authenticate = (username: string, password: string): AuthResult => {
  try {
    const user = accessControlData.users.find((u: { username: string; password: string; role: string }) => u.username === username && u.password === password);
    
    if (user) {
      // Store auth data in localStorage
      const authData = {
        username: user.username,
        role: user.role,
        timestamp: Date.now()
      };
      
      localStorage.setItem('suiverify_auth', JSON.stringify(authData));
      
      return {
        success: true,
        user: { name: user.username, role: user.role }
      };
    } else {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
};

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
      router.push('/dashboard');
    }

    // Get login attempts from localStorage
    const attempts = localStorage.getItem('suiverify_login_attempts');
    if (attempts) {
      setLoginAttempts(parseInt(attempts, 10));
    }
  }, [router]);

  const authenticate = (username: string, password: string): AuthResult => {
    // Check login attempts
    if (loginAttempts >= accessControlData.config.maxLoginAttempts) {
      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.'
      };
    }

    // Find user in access control
    const user = accessControlData.users.find(
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
        name: user.username,
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

  const isBlocked = loginAttempts >= accessControlData.config.maxLoginAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center outfit bg-ghost-white">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-[#F8FAFC] rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4 border-[3px] border-primary"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-2 text-charcoal-text"
          >
            <span className="text-primary">Sui</span>Verify
          </motion.h1>
          <p className="text-sm text-charcoal-text/70">
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
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-charcoal-text">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-primary/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-charcoal-text"
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
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-charcoal-text">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-primary/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-charcoal-text"
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
              className="p-3 rounded-lg border bg-error/10 border-error/30"
            >
              <p className="text-sm text-charcoal-text">{error}</p>
              {!isBlocked && loginAttempts > 0 && (
                <p className="text-xs mt-1 text-charcoal-text/70">
                  Attempts: {loginAttempts}/{accessControlData.config.maxLoginAttempts}
                </p>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || isBlocked}
              className="w-full"
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
            </Button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-6 mt-6 border-t border-primary/40"
        >
          <p className="text-xs text-charcoal-text/60">
            Don&apos;t have access? <Link href="/" className="underline text-primary hover:text-primary-dark">Request access</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
