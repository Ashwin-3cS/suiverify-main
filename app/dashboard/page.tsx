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
        // Redirect to KYC page for verification with type and description
        // In Next.js, we can pass data through URL params or use a global state management solution
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
        <div className="w-full bg-ghost-white outfit min-h-screen">
            {/* Grid Pattern Background */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #DEE2E6 1px, transparent 1px),
            linear-gradient(to bottom, #DEE2E6 1px, transparent 1px)
          `,
                    backgroundSize: "20px 30px",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
                    maskImage:
                        "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
                }}
            />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-ghost-white/80 backdrop-blur-sm border-b border-primary/10">
                <DashboardHeader />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
                    >
                        {/* Total Credentials Card */}
                        <div className="bg-white rounded-lg p-5 border-2 border-primary/20 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-lg bg-primary/10">
                                    <CheckCircle className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wide">Total Credentials</p>
                                <p className="text-2xl font-bold text-charcoal-text">{loading ? '...' : stats.total}</p>
                            </div>
                        </div>

                        {/* Verified Credentials Card */}
                        <div className="bg-white rounded-lg p-5 border-2 border-secondary/20 shadow-[0.1em_0.1em_0_0_rgb(20_184_166)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-lg bg-secondary/10">
                                    <Shield className="w-5 h-5 text-secondary" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wide">Verified</p>
                                <p className="text-2xl font-bold text-charcoal-text">{loading ? '...' : stats.verified}</p>
                            </div>
                        </div>

                        {/* Pending Credentials Card */}
                        <div className="bg-white rounded-lg p-5 border-2 border-warning/20 shadow-[0.1em_0.1em_0_0_rgb(245_158_11)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 rounded-lg bg-warning/10">
                                    <Clock className="w-5 h-5 text-warning" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-charcoal-text/60 mb-1 uppercase tracking-wide">Pending</p>
                                <p className="text-2xl font-bold text-charcoal-text">{loading ? '...' : stats.pending}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Tabs */}
                    <div className="bg-white rounded-lg p-1 mb-6 border-2 border-primary/20 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)]">
                        <nav className="flex space-x-1">
                            {['verifications', 'credentials'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveNav(tab)}
                                    className={`flex-1 py-2 px-4 rounded-md font-bold text-sm capitalize transition-all duration-200 ${
                                        activeNav === tab
                                            ? 'text-white shadow-sm bg-primary'
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
                            <div className="mb-5">
                                <h2 className="text-xl font-bold mb-1 text-charcoal-text">Identity Verifications</h2>
                                <p className="text-xs text-charcoal-text/70">Complete these verifications to unlock full platform access</p>
                            </div>

                            {/* Verification Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {verificationOptions.map((verification) => {
                                    const IconComponent = verification.icon;
                                    return (
                                        <div
                                            key={verification.id}
                                            onClick={() => handleVerificationClick(verification.title, verification.description)}
                                            className="group bg-white rounded-lg p-6 border-2 border-primary/20 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] transition-all duration-200 cursor-pointer"
                                        >
                                            {/* Icon */}
                                            <div className="flex justify-center mb-4">
                                                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                    <IconComponent className="w-8 h-8 text-primary" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="text-center">
                                                <h3 className="text-lg font-bold mb-2 text-charcoal-text">
                                                    {verification.title}
                                                </h3>
                                                <p className="text-sm text-charcoal-text/70 mb-5 leading-relaxed">
                                                    {verification.description}
                                                </p>
                                                <Button
                                                    variant="primary"
                                                    className="w-full"
                                                >
                                                    Start Verification
                                                </Button>
                                                <p className="text-xs text-center mt-3 text-charcoal-text/60">
                                                    Accepted by <span className="text-primary font-semibold">Alphafi</span> and <span className="text-primary font-semibold">Suilend</span>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Credentials Section */}
                    {activeNav === 'credentials' && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-xl font-bold mb-1 text-charcoal-text">Credentials</h2>
                                    <p className="text-xs text-charcoal-text/70">View and manage credentials stored in your identity wallet</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search credentials..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border-2 border-primary/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-charcoal-text placeholder-charcoal-text/40 text-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-error/10 border border-error/30 rounded-lg p-4 mb-6"
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-error" />
                                            <p className="text-charcoal-text font-medium">{error}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p className="text-charcoal-text/70">Loading credentials...</p>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && !error && credentials.length === 0 && (
                                    <div className="text-center py-12">
                                        <FileText className="w-16 h-16 mx-auto mb-4 text-charcoal-text/40" />
                                        <p className="text-lg mb-2 text-charcoal-text">No credentials found</p>
                                        <p className="text-sm text-charcoal-text/70">Complete identity verifications to see your credentials here</p>
                                    </div>
                                )}

                            {/* Credentials Grid */}
                            {!loading && !error && credentials.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {credentials.map((credential, index) => (
                                        <motion.div
                                            key={credential.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                            whileHover={{ y: -4 }}
                                            className="group bg-white rounded-xl p-5 border-2 border-primary/20 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] transition-all duration-200"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-base text-charcoal-text truncate">{credential.title}</h3>
                                                        {getStatusIcon(credential.status)}
                                                    </div>
                                                    <p className="text-xs text-charcoal-text/70 line-clamp-2">{credential.description}</p>
                                                </div>
                                            </div>

                                            <div className="mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                                                <p className="text-xs font-semibold text-charcoal-text/60 mb-0.5">Expiry Date</p>
                                                <p className="text-sm font-bold text-charcoal-text">{credential.expiryDate}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-charcoal-text/60">Issued</p>
                                                        <p className="text-xs text-charcoal-text/70">{credential.issuedDate}</p>
                                                    </div>
                                                </div>
                                                {credential.type === 'nft' && (
                                                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-primary/10 text-primary border border-primary/20">NFT</span>
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
