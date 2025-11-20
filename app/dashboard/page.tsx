"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
// import DashboardLayout from '../components/DashboardLayout';
// import LightRays from '../components/ui/lightRays';
import { credentialService, type CredentialData, type CredentialStats } from '@/services/credentialService';
import { Shield, FileText, CheckCircle, Clock, AlertCircle, Calendar, Users } from 'lucide-react';
import { colors } from '@/app/brand';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

const User: React.FC = () => {
    const router = useRouter();
    const currentAccount = useCurrentAccount();
    // const [activeFilter, setActiveFilter] = useState('Active');
    const [activeNav, setActiveNav] = useState('verifications');
    const [searchQuery, setSearchQuery] = useState('');

    // Backend data state
    const [credentials, setCredentials] = useState<CredentialData[]>([]);
    const [stats, setStats] = useState<CredentialStats>({ total: 0, verified: 0, pending: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verification options that redirect to KYC
    const verificationOptions = [
        {
            id: 1,
            title: 'Verify Above 18',
            description: 'Verify your age using Aadhaar document. Required for DeFi protocols and Gaming protocols on SUI ecosystem.',
            icon: Calendar,
            status: 'not_verified',
            delay: 0.1
        },
        {
            id: 2,
            title: 'Citizenship Verification',
            description: 'Verify your citizenship status. Required for DeFi protocols and Gaming protocols on SUI ecosystem.',
            icon: Users,
            status: 'not_verified',
            delay: 0.2
        },
    ];

    const handleVerificationClick = (verificationType: string, verificationDescription: string) => {
        // Check if wallet is connected before starting verification
        if (!currentAccount?.address) {
            toast.error('Please connect wallet', {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            return;
        }
        
        // Redirect to KYC page for verification with type and description
        router.push(`/kyc?type=${encodeURIComponent(verificationType)}&description=${encodeURIComponent(verificationDescription)}`);
    };

    // Fetch credentials from backend
    useEffect(() => {
        const fetchCredentials = async () => {
            if (!currentAccount?.address) return;

            setLoading(true);
            setError(null);

            try {
                const { credentials: fetchedCredentials, stats: fetchedStats } = await credentialService.getUserCredentials(currentAccount.address);
                setCredentials(fetchedCredentials);
                setStats(fetchedStats);
            } catch (error) {
                console.error('Failed to fetch credentials:', error);
                setError('Failed to load credentials');
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [currentAccount?.address]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="w-5 h-5 text-success" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-warning" />;
            case 'expired':
                return <AlertCircle className="w-5 h-5 text-error" />;
            default:
                return <Clock className="w-5 h-5 text-charcoal-text/40" />;
        }
    };

    return (
        <div className="w-full bg-ghost-white outfit min-h-screen relative overflow-hidden">
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
                    backgroundSize: '40px 40px'
                }}
            ></div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-ghost-white/90 backdrop-blur-md border-b border-primary/20 shadow-sm">
                <DashboardHeader />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Page Header */}
                    <div className="mb-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-2xl md:text-3xl font-bold mb-1"
                        >
                            <span className="text-primary">Identity</span>
                            <span className="text-charcoal-text"> Dashboard</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-sm text-charcoal-text/70"
                        >
                            Manage your verified identities and credentials
                        </motion.p>
                    </div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                    >
                        {/* Total Credentials Card */}
                        <div className="bg-gradient-to-br from-white to-primary/5 backdrop-blur-sm rounded-xl p-6 border-[3px] border-primary/30 shadow-[0.1em_0.1em] hover:shadow-[0.15em_0.15em] transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/15 border-2 border-primary/20">
                                        <CheckCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wider">Total Credentials</p>
                                        <p className="text-3xl font-bold text-charcoal-text leading-none">{loading ? '...' : stats.total}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verified Credentials Card */}
                        <div className="bg-gradient-to-br from-white to-secondary/5 backdrop-blur-sm rounded-xl p-6 border-[3px] border-secondary/30 shadow-[0.1em_0.1em] hover:shadow-[0.15em_0.15em] transition-all duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-secondary/15 border-2 border-secondary/20">
                                        <Shield className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wider">Verified</p>
                                        <p className="text-3xl font-bold text-charcoal-text leading-none">{loading ? '...' : stats.verified}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Tabs */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-1.5 mb-8 border-[3px] border-primary/30 shadow-[0.1em_0.1em]">
                        <nav className="flex space-x-1.5">
                            {['verifications', 'credentials'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveNav(tab)}
                                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm capitalize transition-all duration-200 ${
                                        activeNav === tab
                                            ? 'text-white shadow-[0.1em_0.1em] bg-primary border-[3px] border-primary'
                                            : 'text-charcoal-text/70 hover:text-charcoal-text bg-transparent hover:bg-primary/5'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Verifications Section */}
                    {activeNav === 'verifications' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2 text-charcoal-text">Identity Verifications</h2>
                                <p className="text-sm text-charcoal-text/70">Complete these verifications to unlock full platform access</p>
                            </div>

                            {/* Verification Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {verificationOptions.map((verification) => {
                                    const IconComponent = verification.icon;
                                    return (
                                        <motion.div
                                            key={verification.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: verification.delay }}
                                            onClick={() => handleVerificationClick(verification.title, verification.description)}
                                            className="group bg-gradient-to-br from-white to-primary/5 backdrop-blur-sm rounded-xl p-8 border-[3px] border-primary/30 shadow-[0.1em_0.1em] hover:shadow-[0.15em_0.15em] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] transition-all duration-200 cursor-pointer"
                                        >
                                            {/* Icon */}
                                            <div className="flex justify-center mb-6">
                                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary/15 border-2 border-primary/20 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-200">
                                                    <IconComponent className="w-10 h-10 text-primary" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold mb-3 text-charcoal-text">
                                                    {verification.title}
                                                </h3>
                                                <p className="text-sm text-charcoal-text/70 mb-6 leading-relaxed">
                                                    {verification.description}
                                                </p>
                                                <Button
                                                    variant="primary"
                                                    className="w-full mb-4"
                                                    size="lg"
                                                >
                                                    Start Verification
                                                </Button>
                                                <p className="text-xs text-center text-charcoal-text/60">
                                                    Accepted by <span className="text-primary font-semibold">Alphafi</span> and <span className="text-primary font-semibold">Suilend</span>
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Credentials Section */}
                    {activeNav === 'credentials' && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2 text-charcoal-text">Credentials</h2>
                                    <p className="text-sm text-charcoal-text/70">View and manage credentials stored in your identity wallet</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 sm:flex-initial sm:w-72">
                                        <input
                                            type="text"
                                            placeholder="Search credentials..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-[3px] border-primary/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-charcoal-text placeholder-charcoal-text/40 text-sm transition-all shadow-[0.1em_0.1em]"
                                        />
                                    </div>
                                </div>
                            </div>

                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-error/10 border-[3px] border-error/30 rounded-xl p-5 mb-6 shadow-[0.1em_0.1em]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-error/20">
                                                <AlertCircle className="w-5 h-5 text-error" />
                                            </div>
                                            <p className="text-charcoal-text font-semibold">{error}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="text-center py-16">
                                        <div className="relative mx-auto w-16 h-16 mb-6">
                                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                                            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/30"></div>
                                        </div>
                                        <p className="text-charcoal-text font-semibold">Loading credentials...</p>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && !error && credentials.length === 0 && (
                                    <div className="text-center py-16 bg-white/95 backdrop-blur-sm rounded-xl p-12 border-[3px] border-primary/20 shadow-[0.1em_0.1em]">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-primary" />
                                        </div>
                                        <p className="text-xl font-bold mb-2 text-charcoal-text">No credentials found</p>
                                        <p className="text-sm text-charcoal-text/70">Complete identity verifications to see your credentials here</p>
                                    </div>
                                )}

                            {/* Credentials Grid */}
                            {!loading && !error && credentials.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {credentials.map((credential, index) => (
                                        <motion.div
                                            key={credential.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                            whileHover={{ y: -4 }}
                                            className="group bg-gradient-to-br from-white to-primary/5 backdrop-blur-sm rounded-xl p-6 border-[3px] border-primary/30 shadow-[0.1em_0.1em] hover:shadow-[0.15em_0.15em] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-lg text-charcoal-text truncate">{credential.title}</h3>
                                                        {getStatusIcon(credential.status)}
                                                    </div>
                                                    <p className="text-sm text-charcoal-text/70 line-clamp-2 leading-relaxed">{credential.description}</p>
                                                </div>
                                            </div>

                                            <div className="mb-5 p-4 rounded-xl bg-primary/10 border-2 border-primary/20">
                                                <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wider">Expiry Date</p>
                                                <p className="text-base font-bold text-charcoal-text">{credential.expiryDate}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t-2 border-primary/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">Issued</p>
                                                        <p className="text-sm font-medium text-charcoal-text">{credential.issuedDate}</p>
                                                    </div>
                                                </div>
                                                {credential.type === 'nft' && (
                                                    <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/15 text-primary border-2 border-primary/20">NFT</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default User;
