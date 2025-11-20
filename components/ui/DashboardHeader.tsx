"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/logo.svg";
import AuthButton from "@/components/auth/AuthButton";

const DashboardHeader = () => {
    const router = useRouter();
    const pathname = usePathname();
    const currentAccount = useCurrentAccount();
    const previousAddressRef = useRef<string | null | undefined>(undefined);
    const isInitialMount = useRef(true);
    
    const isAdminRoute = pathname.startsWith('/admin');
    
    // Show toast notification when wallet connects/disconnects (only on actual changes, not initial load)
    useEffect(() => {
        const currentAddress = currentAccount?.address || null;
        
        // Skip on initial mount - just store the current address without showing toast
        if (isInitialMount.current) {
            isInitialMount.current = false;
            previousAddressRef.current = currentAddress;
            return;
        }
        
        const previousAddress = previousAddressRef.current;
        
        // Wallet connected (changed from disconnected to connected)
        if (currentAddress && previousAddress === null) {
            const shortAddress = `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`;
            toast.success(`Wallet connected: ${shortAddress}`, {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
        // Wallet disconnected (changed from connected to disconnected)
        else if (!currentAddress && previousAddress !== null) {
            toast.info('Wallet disconnected', {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
        // Wallet changed (different address)
        else if (currentAddress && previousAddress !== null && currentAddress !== previousAddress) {
            const shortAddress = `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`;
            toast.info(`Wallet changed: ${shortAddress}`, {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
        
        previousAddressRef.current = currentAddress;
    }, [currentAccount?.address]);
    
    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminUsername');
        router.push('/adminLogin');
    };
    return (
        <div className="relative z-50">
            {/* Navigation Bar */}
            <nav className="px-4 sm:px-6 lg:px-8 py-4 relative z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-3">
                        <Image src={Logo} alt="SuiVerify" className="w-10 h-auto sm:w-12" />
                    </div>

                    {/* Right Side - Auth, Wallet Connect, and Logout */}
                    <div className="flex items-center space-x-4 relative z-50">
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

                        {/* zkLogin Sign In Button */}
                        <AuthButton size="sm" />

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