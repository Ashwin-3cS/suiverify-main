"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/logo.svg";
import AuthButton from "@/components/auth/AuthButton";

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
        <div className="relative z-50">
            {/* Navigation Bar */}
            <nav className="px-6 py-4 relative z-50">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <Image src={Logo} alt="SuiVerify" className="w-24 h-auto" />
                    </div>

                    {/* Right Side - Auth, Wallet Connect, and Logout */}
                    <div className="flex items-center space-x-4 relative z-50">
                        {/* Logout Button - Only show on admin routes */}
                        {isAdminRoute && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        )}

                        {/* zkLogin Sign In Button */}
                        <AuthButton size="sm" />

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2">
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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