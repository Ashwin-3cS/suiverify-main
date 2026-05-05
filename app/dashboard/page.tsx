"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    credentialService,
    type CredentialData,
    type CredentialStats,
} from "@/services/credentialService";
import {
    Shield,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    Calendar,
    Users,
    ArrowRight,
} from "lucide-react";
import { colors } from "@/app/brand";
import DashboardHeader from "@/components/ui/DashboardHeader";
import ZkLoginTransactionTest from "@/components/zklogin/ZkLoginTransactionTest";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentAccount } from "@mysten/dapp-kit";

const User: React.FC = () => {
    const router = useRouter();
    const { address: zkAddress, isAuthenticated: zkAuthenticated } = useAuth();
    const walletAccount = useCurrentAccount();
    const address = zkAddress || walletAccount?.address || null;
    const isAuthenticated = zkAuthenticated || !!walletAccount;
    const [activeNav, setActiveNav] = useState("verifications");
    const [searchQuery, setSearchQuery] = useState("");
    const fetchedForRef = React.useRef<string | null>(null);

    // Format date to match the display format
    const formatIssuedDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toISOString();
        } catch (error) {
            return dateString;
        }
    };

    // Backend data state
    const [credentials, setCredentials] = useState<CredentialData[]>([]);
    const [stats, setStats] = useState<CredentialStats>({
        total: 0,
        verified: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verification options that redirect to KYC
    const verificationOptions = [
        {
            id: 1,
            title: "Identity Verification",
            description:
                "Complete once to unlock 18+ eligibility and tax-linked financial apps on SUI via your DID.",
            icon: Calendar,
            status: "not_verified",
            delay: 0.1,
            color: "primary",
        },
    ];

    const handleVerificationClick = (
        verificationType: string,
        verificationDescription: string
    ) => {
        // Check if user is authenticated with zkLogin before starting verification
        if (!isAuthenticated || !address) {
            toast.error("Please sign in to continue", {
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
        router.push(
            `/kyc?type=${encodeURIComponent(
                verificationType
            )}&description=${encodeURIComponent(verificationDescription)}`
        );
    };

    // Fetch credentials from backend
    useEffect(() => {
        if (!address || address === fetchedForRef.current) return;
        fetchedForRef.current = address;

        const fetchCredentials = async () => {
            setLoading(true);
            setError(null);

            try {
                const { credentials: fetchedCredentials, stats: fetchedStats } =
                    await credentialService.getUserCredentials(address);
                setCredentials(fetchedCredentials);
                setStats(fetchedStats);
            } catch (error) {
                console.error("Failed to fetch credentials:", error);
                setError("Failed to load credentials");
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [address]);

    // If user arrived here from a partner /connect flow, redirect back once authenticated.
    useEffect(() => {
        if (!isAuthenticated && !walletAccount) return;
        const ctx = sessionStorage.getItem('suiverify:partner_ctx');
        if (ctx) router.push('/connect?step=resume');
    }, [isAuthenticated, walletAccount, router]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "verified":
                return <CheckCircle className="w-5 h-5 text-success" />;
            case "pending":
                return <Clock className="w-5 h-5 text-warning" />;
            case "expired":
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
                    backgroundSize: "40px 40px",
                }}
            ></div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-ghost-white/90 backdrop-blur-md border-b border-primary/20 shadow-sm">
                <DashboardHeader />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Hero Section with Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-primary text-white p-4 rounded-lg w-fit mx-auto">
                                    Identity Dashboard
                                </h1>
                                <p className="text-base text-charcoal-text/70 max-w-2xl">
                                    Manage your verified identities and credentials in one secure
                                    place
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-[3px] border-primary/30 shadow-[0.1em_0.1em]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-primary/15">
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        </div>
                                        <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">
                                            Total
                                        </p>
                                    </div>
                                    <p className="text-3xl font-bold text-charcoal-text">
                                        {loading ? "..." : stats.total}
                                    </p>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-[3px] border-secondary/30 shadow-[0.1em_0.1em]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-secondary/15">
                                            <Shield className="w-5 h-5 text-secondary" />
                                        </div>
                                        <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">
                                            Verified
                                        </p>
                                    </div>
                                    <p className="text-3xl font-bold text-charcoal-text">
                                        {loading ? "..." : stats.verified}
                                    </p>
                                </div>

                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-[3px] border-warning/30 shadow-[0.1em_0.1em]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-warning/15">
                                            <Clock className="w-5 h-5 text-warning" />
                                        </div>
                                        <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">
                                            Pending
                                        </p>
                                    </div>
                                    <p className="text-3xl font-bold text-charcoal-text">
                                        {loading ? "..." : stats.pending}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-8"
                        >
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 border-[3px] border-primary/30 shadow-[0.1em_0.1em] inline-flex">
                                <nav className="flex gap-2">
                                    {["verifications", "credentials"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveNav(tab)}
                                            className={`px-8 py-3 rounded-xl font-bold text-sm capitalize transition-all duration-200 ${activeNav === tab
                                                ? "text-white shadow-[0.1em_0.1em] bg-primary border-[3px] border-primary"
                                                : "text-charcoal-text/70 hover:text-charcoal-text bg-transparent hover:bg-primary/5"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </motion.div>

                        {/* Verifications Section */}
                        {activeNav === "verifications" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold mb-2 text-charcoal-text">
                                        Identity Verifications
                                    </h2>
                                    <p className="text-base text-charcoal-text/70">
                                        Complete these verifications to unlock full platform access
                                    </p>
                                </div>

                                {/* Verification Cards - Side by Side with Better Design */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {verificationOptions.map((verification) => {
                                        const IconComponent = verification.icon;
                                        const isPrimary = verification.color === "primary";
                                        return (
                                            <motion.div
                                                key={verification.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: verification.delay,
                                                }}
                                                onClick={() =>
                                                    handleVerificationClick(
                                                        verification.title,
                                                        verification.description
                                                    )
                                                }
                                                className={`group relative overflow-hidden bg-gradient-to-br ${isPrimary
                                                    ? "from-primary/10 via-white to-primary/5 "
                                                    : "from-secondary/10 via-white to-secondary/5"
                                                    } backdrop-blur-sm rounded-2xl p-8 border-[3px] ${isPrimary
                                                        ? "border-primary/30"
                                                        : "border-secondary/30"
                                                    } shadow-[0.1em_0.1em] hover:shadow-[0.2em_0.2em] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] transition-all duration-300 cursor-pointer`}
                                            >
                                                {/* Decorative Background Element */}
                                                <div
                                                    className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${isPrimary ? "bg-primary" : "bg-secondary"
                                                        }`}
                                                ></div>

                                                <div className="relative z-10">
                                                    {/* Icon and Badge */}
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div
                                                            className={`p-4 rounded-2xl ${isPrimary
                                                                ? "bg-primary/20 border-2 border-primary/30"
                                                                : "bg-secondary/20 border-2 border-secondary/30"
                                                                } group-hover:scale-110 transition-transform duration-300`}
                                                        >
                                                            <IconComponent
                                                                className={`w-8 h-8 ${isPrimary ? "text-primary" : "text-secondary"
                                                                    }`}
                                                            />
                                                        </div>
                                                        <div
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isPrimary
                                                                ? "bg-primary/15 text-primary border border-primary/30"
                                                                : "bg-secondary/15 text-secondary border border-secondary/30"
                                                                }`}
                                                        >
                                                            Required
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div>
                                                        <h3
                                                            className={`text-2xl font-bold mb-3 text-charcoal-text group-hover:${isPrimary ? "text-primary" : "text-secondary"
                                                                } transition-colors`}
                                                        >
                                                            {verification.title}
                                                        </h3>
                                                        <p className="text-sm text-charcoal-text/70 mb-6 leading-relaxed">
                                                            {verification.description}
                                                        </p>

                                                        <Button
                                                            variant={isPrimary ? "primary" : "secondary"}
                                                            className="w-full mb-4 group/btn"
                                                            size="lg"
                                                        >
                                                            Start Verification
                                                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                        </Button>

                                                        <div className="flex items-center justify-center text-xs text-charcoal-text/60">
                                                            <span className="mr-2">Accepted by</span>
                                                            <span
                                                                className={`font-semibold ${isPrimary ? "text-primary" : "text-secondary"
                                                                    }`}
                                                            >
                                                                b2f
                                                            </span>
                                                            <span className="text-charcoal-text/40">•</span>
                                                            <span
                                                                className={`font-semibold ${isPrimary ? "text-primary" : "text-secondary"
                                                                    }`}
                                                            >
                                                                WalDrop
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* zkLogin Transaction Test Section */}
                        {activeNav === "zkLogin" && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="mb-8">
                                    <h2
                                        className="text-2xl font-bold mb-2"
                                        style={{ color: colors.white }}
                                    >
                                        zkLogin Testnet Test
                                    </h2>
                                    <p className="text-sm" style={{ color: colors.lightBlue }}>
                                        Test your zkLogin integration on Sui Testnet
                                    </p>
                                </div>

                                <ZkLoginTransactionTest />
                            </motion.div>
                        )}

                        {/* Credentials Section */}
                        {activeNav === "credentials" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2 text-charcoal-text">
                                            Your Credentials
                                        </h2>
                                        <p className="text-base text-charcoal-text/70">
                                            View and manage credentials stored in your identity wallet
                                        </p>
                                    </div>
                                    <div className="sm:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search credentials..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-[3px] border-primary/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-charcoal-text placeholder-charcoal-text/40 text-sm transition-all shadow-[0.1em_0.1em]"
                                        />
                                    </div>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-error/10 border-[3px] border-error/30 rounded-xl p-6 mb-6 shadow-[0.1em_0.1em]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-error/20">
                                                <AlertCircle className="w-6 h-6 text-error" />
                                            </div>
                                            <p className="text-charcoal-text font-semibold">
                                                {error}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="text-center py-20">
                                        <div className="relative mx-auto w-20 h-20 mb-6">
                                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary"></div>
                                            <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-primary/30"></div>
                                        </div>
                                        <p className="text-lg font-semibold text-charcoal-text">
                                            Loading credentials...
                                        </p>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && !error && credentials.length === 0 && (
                                    <div className="text-center py-20 bg-white/95 backdrop-blur-sm rounded-2xl p-16 border-[3px] border-primary/20 shadow-[0.1em_0.1em]">
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                            <FileText className="w-12 h-12 text-primary" />
                                        </div>
                                        <p className="text-2xl font-bold mb-3 text-charcoal-text">
                                            No credentials found
                                        </p>
                                        <p className="text-base text-charcoal-text/70 mb-6">
                                            Complete identity verifications to see your credentials
                                            here
                                        </p>
                                        <Button
                                            variant="primary"
                                            onClick={() => setActiveNav("verifications")}
                                        >
                                            Start Verification
                                        </Button>
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
                                                whileHover={{ y: -6, scale: 1.02 }}
                                                className="group relative overflow-hidden bg-gradient-to-br from-white to-primary/5 backdrop-blur-sm rounded-2xl p-6 border-[3px] border-primary/30 shadow-[0.1em_0.1em] hover:shadow-[0.2em_0.2em] transition-all duration-300"
                                            >
                                                {/* Decorative Corner */}
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full"></div>

                                                <div className="relative z-10">
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <h3 className="font-bold text-lg text-charcoal-text truncate">
                                                                    {credential.title}
                                                                </h3>
                                                                {getStatusIcon(credential.status)}
                                                            </div>
                                                            <p className="text-sm text-charcoal-text/70 line-clamp-2 leading-relaxed">
                                                                {credential.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t-2 border-primary/20">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
                                                                <span className="text-base font-bold text-primary">
                                                                    #{index + 1}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-charcoal-text/60 uppercase tracking-wider">
                                                                    Issued
                                                                </p>
                                                                <p className="text-sm font-medium text-charcoal-text">
                                                                    {formatIssuedDate(credential.issuedDate)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {credential.type === "nft" && (
                                                            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/15 text-primary border-2 border-primary/20">
                                                                DID
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default User;
