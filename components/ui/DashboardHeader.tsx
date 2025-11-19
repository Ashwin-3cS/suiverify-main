"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/head_logo.png";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
    const router = useRouter();
    const pathname = usePathname();
    
    const isAdminRoute = pathname.startsWith('/admin');
    
    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUsername');
        router.push('/adminLogin');
    };
    return (
        <div className="relative z-50 bg-ghost-white/80 backdrop-blur-sm">
            {/* Navigation Bar */}
            <nav className="px-4 sm:px-6 lg:px-8 py-3 relative z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <Image src={Logo} alt="SuiVerify" className="w-10 h-auto sm:w-12" />
                    </div>

                    {/* Right Side - Balance and Connect Wallet */}
                    <div className="flex items-center space-x-3 sm:space-x-4 relative z-50">
                        {/* Logout Button - Only show on admin routes */}
                        {isAdminRoute && (
                            <Button
                                onClick={handleLogout}
                                variant="error"
                                size="sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        )}

                        <div className="connect-button-wrapper">
                            <ConnectButton
                                connectText="Connect Wallet"
                            />
                        </div>

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors">
                            <svg className="w-6 h-6 text-charcoal-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    )
}

export default DashboardHeader