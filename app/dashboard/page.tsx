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
        <div className="w-full bg-ghost-white outfit" style={{ position: 'relative', minHeight: '100vh' }}>
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

            {/* Hero Section */}
            <div className="relative h-screen flex flex-col pt-[10rem]">
                <div className="absolute top-4 w-full z-50">
                    <DashboardHeader />
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-4xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <motion.h1
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-4xl md:text-6xl font-bold mb-4"
                            >
                                <motion.span className="text-primary">Identity</motion.span>
                                <motion.span className="text-charcoal-text"> Dashboard</motion.span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-xl text-charcoal-text/70"
                            >
                                View and manage identities stored in your wallet
                            </motion.p>
                        </motion.div>
                    </div>
                </div>
                {/* Main Content Section */}
                <div className="relative z-10 min-h-screen">
                    <div className="max-w-5xl mx-auto px-6 pb-20">
                        {/* Stats Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12 pt-4"
                        >
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="relative p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] border border-primary/20"
                            >
                                <div className="relative z-10 flex items-center">
                                    <div className="p-3 rounded-2xl bg-primary/20">
                                        <CheckCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-charcoal-text/70">Total Credentials</p>
                                        <p className="text-2xl font-bold text-charcoal-text">{loading ? '...' : stats.total}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="relative p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-[0.1em_0.1em_0_0_rgb(20_184_166)] hover:shadow-[0.15em_0.15em_0_0_rgb(20_184_166)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] border border-secondary/20"
                            >
                                <div className="relative z-10 flex items-center">
                                    <div className="p-3 rounded-2xl bg-secondary/20">
                                        <Shield className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-charcoal-text/70">Verified Credentials</p>
                                        <p className="text-2xl font-bold text-charcoal-text">{loading ? '...' : stats.verified}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Navigation Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white rounded-2xl p-2 mb-8 border border-primary/20 shadow-soft"
                        >
                            <nav className="flex space-x-2">
                                {['verifications', 'credentials'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveNav(tab)}
                                        className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm capitalize transition-all duration-300 ${activeNav === tab
                                            ? 'text-white shadow-lg bg-primary'
                                            : 'text-charcoal-text/70 hover:text-charcoal-text bg-transparent'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </motion.div>

                        {/* Verifications Section */}
                        {activeNav === 'verifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-2 text-charcoal-text">Identity Verifications</h2>
                                    <p className="text-sm text-charcoal-text/70">Complete these verifications to unlock full platform access</p>
                                </div>

                                {/* Verification Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {verificationOptions.map((verification) => {
                                        const IconComponent = verification.icon;
                                        return (
                                            <motion.div
                                                key={verification.id}
                                                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                                                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                                transition={{ duration: 0.8, delay: verification.delay, type: "spring", stiffness: 100 }}
                                                whileHover={{
                                                    y: -12,
                                                    rotateX: 5,
                                                    transition: { duration: 0.3 }
                                                }}
                                                onClick={() => handleVerificationClick(verification.title, verification.description)}
                                                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] border border-primary/20"
                                            >
                                                <div className="relative z-10">
                                                    {/* Icon */}
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        whileInView={{ scale: 1, rotate: 0 }}
                                                        transition={{ duration: 0.8, delay: verification.delay + 0.2, type: "spring", stiffness: 150 }}
                                                        className="relative mb-6"
                                                    >
                                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-primary/20 group-hover:bg-primary/30 transition-colors">
                                                            <IconComponent className="w-8 h-8 text-primary" />
                                                        </div>
                                                    </motion.div>

                                                    {/* Content */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: verification.delay + 0.4, duration: 0.6 }}
                                                    >
                                                        <h3 className="text-xl font-bold mb-3 text-center text-charcoal-text">
                                                            {verification.title}
                                                        </h3>
                                                        <p className="text-sm leading-relaxed text-center text-charcoal-text/80 mb-4">
                                                            {verification.description}
                                                        </p>

                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 bg-primary text-white border-[3px] border-primary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em]"
                                                        >
                                                            Start Verification
                                                        </motion.button>
                                                        <p className="text-xs text-center mt-3 text-charcoal-text/60 font-medium">
                                                            Accepted by <span className="text-primary">Alphafi</span> and <span className="text-primary">Suilend</span>
                                                        </p>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Credentials Section */}
                        {activeNav === 'credentials' && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2 text-charcoal-text">Credentials</h2>
                                        <p className="text-sm text-charcoal-text/70">View and manage credentials stored in your identity wallet</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Search credentials..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="px-4 py-2 bg-white border border-primary/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-charcoal-text placeholder-charcoal-text/40 text-sm"
                                        />
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {credentials.map((credential, index) => (
                                            <motion.div
                                                key={credential.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                                whileHover={{ y: -8, scale: 1.02 }}
                                                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 transition-all duration-300 bg-gradient-to-br from-primary/10 to-primary/5 shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] border border-primary/20"
                                            >
                                                <div className="relative z-10">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-lg mb-1 text-charcoal-text">{credential.title}</h3>
                                                            <p className="text-sm text-charcoal-text/70">{credential.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(credential.status)}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <p className="text-xs text-charcoal-text/60">Exp: {credential.expiryDate}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-bold text-primary">{index + 1}</div>
                                                            </div>
                                                            <div className="text-xs text-charcoal-text/60">
                                                                Issued on: {credential.issuedDate}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {credential.type === 'nft' && (
                                                                <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary">NFT</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default User;
