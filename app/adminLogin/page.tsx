"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Get admin credentials from environment variables
    const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Store authentication in localStorage
                localStorage.setItem('adminAuthenticated', 'true');
                localStorage.setItem('adminUsername', username);

                // Navigate to admin dashboard
                router.push('/admin');
            } else {
                setError('Invalid username or password');
            }
        } catch (error) {
            setError(`${error},Login failed. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Check if already authenticated
    useEffect(() => {
        const isAuthenticated = localStorage.getItem('adminAuthenticated');
        if (isAuthenticated === 'true') {
            router.push('/admin');
        }
    }, [router]);

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-ghost-white outfit relative overflow-hidden">
            {/* Blob Animations Background */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Subtle gradient overlay for depth */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

            {/* Subtle pattern overlay */}
            <div
                className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)`,
                    backgroundSize: "40px 40px",
                }}
            ></div>

            {/* Login Form */}
            <div className="relative z-10 w-full max-w-md mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="bg-white/95 backdrop-blur-sm rounded-3xl border-[3px] border-primary/30 shadow-[0.1em_0.1em] p-8"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-center mb-8"
                    >
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/15">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-charcoal-text">Admin Login</h1>
                        <p className="text-sm text-charcoal-text/70">Access government document decryption portal</p>
                    </motion.div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Username Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <label htmlFor="username" className="block text-sm font-medium mb-2 text-charcoal-text">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full px-4 py-3 rounded-xl text-charcoal-text placeholder-gray-400 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all border-2 border-primary/30 bg-white"
                                required
                            />
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <label htmlFor="password" className="block text-sm font-medium mb-2 text-charcoal-text">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-charcoal-text placeholder-gray-400 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all border-2 border-primary/30 bg-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-charcoal-text transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-4 rounded-xl border-2 border-error bg-error/10"
                            >
                                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                                <p className="text-sm text-error font-medium">{error}</p>
                            </motion.div>
                        )}

                        {/* Login Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <Button
                                type="submit"
                                disabled={loading || !username || !password}
                                className="w-full flex items-center justify-center gap-2"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Login to Admin Portal
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-xs text-charcoal-text/60">
                            Authorized government personnel only
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
