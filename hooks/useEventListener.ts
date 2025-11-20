import { useState, useEffect, useCallback } from 'react';
// Commented out EOA wallet import - using zkLogin instead
// import { useCurrentAccount } from '@mysten/dapp-kit';
import { useAuth } from '@/hooks/useAuth';
import { startEventListener, setVerificationCallback, stopEventListener, type VerificationCompletedEventData } from '@/services/eventListener';

export interface VerificationStatus {
    isListening: boolean;
    isVerified: boolean;
    verificationMessage: string;
    userAddress: string | null;
    userDidId: string | null;
    // Enhanced event data for NFT claiming
    eventData: VerificationCompletedEventData | null;
}

export const useVerificationListener = () => {
    // Use zkLogin address instead of EOA wallet
    const { address: zkLoginAddress } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
        isListening: false,
        isVerified: false,
        verificationMessage: '',
        userAddress: null,
        userDidId: null,
        eventData: null
    });

    // Handle verification completion from event listener
    const handleVerificationEvent = useCallback((eventData: VerificationCompletedEventData) => {
        const currentUserAddress = zkLoginAddress;

        console.log(`🎯 Event received for address: ${eventData.user_address}`);
        console.log(`🔍 Current zkLogin address: ${currentUserAddress}`);
        console.log(`📅 Signature timestamp: ${eventData.signature_timestamp_ms}`);
        console.log(`🔍 Evidence hash length: ${eventData.evidence_hash.length}`);

        // Check if the event is for the current logged-in user
        if (currentUserAddress && eventData.user_address === currentUserAddress) {
            console.log(`✅ Event matches current user!`);

            if (eventData.status === 1) { // STATUS_VERIFIED
                setVerificationStatus(prev => ({
                    ...prev,
                    isVerified: true,
                    verificationMessage: '✅ Verification completed from event listener!',
                    userDidId: eventData.user_did_id,
                    eventData: eventData  // Store complete event data for NFT claiming
                }));

                // Show success notification
                console.log('🎉 VERIFICATION COMPLETED FROM EVENT LISTENER!');

            } else if (eventData.status === 2) { // STATUS_REJECTED
                setVerificationStatus(prev => ({
                    ...prev,
                    isVerified: false,
                    verificationMessage: '❌ Verification rejected from event listener',
                    userDidId: eventData.user_did_id,
                    eventData: eventData
                }));
            }
        } else {
            console.log(`ℹ️ Event for different user, ignoring`);
        }
    }, [zkLoginAddress]);

    // Start listening for verification events
    const startListening = useCallback(async () => {
        if (!zkLoginAddress) {
            console.warn('⚠️ No zkLogin address found, cannot start event listener');
            return;
        }

        try {
            console.log(`🚀 Starting verification listener for zkLogin address: ${zkLoginAddress}`);

            // Set the callback for event notifications
            setVerificationCallback(handleVerificationEvent);

            // Start the event listener
            await startEventListener();

            setVerificationStatus(prev => ({
                ...prev,
                isListening: true,
                userAddress: zkLoginAddress,
                verificationMessage: 'Listening for verification events...',
                userDidId: null
            }));

        } catch (error) {
            console.error('❌ Failed to start verification listener:', error);
            setVerificationStatus(prev => ({
                ...prev,
                verificationMessage: 'Failed to start event listener',
                userDidId: null
            }));
        }
    }, [zkLoginAddress, handleVerificationEvent]);

    // Stop listening for verification events
    const stopListening = useCallback(() => {
        console.log('🛑 Stopping verification listener');
        stopEventListener();

        setVerificationStatus({
            isListening: false,
            isVerified: false,
            verificationMessage: '',
            userAddress: null,
            userDidId: null,
            eventData: null
        });
    }, []);

    // Reset verification status
    const resetVerification = useCallback(() => {
        setVerificationStatus(prev => ({
            ...prev,
            isVerified: false,
            verificationMessage: prev.isListening ? 'Listening for verification events...' : '',
            userDidId: null,
            eventData: null
        }));
    }, []);

    // Auto-start listener when zkLogin address is available
    useEffect(() => {
        if (zkLoginAddress && !verificationStatus.isListening) {
            startListening();
        }

        // Cleanup on unmount or address change
        return () => {
            if (verificationStatus.isListening) {
                stopListening();
            }
        };
    }, [zkLoginAddress]);

    // Update user address when zkLogin address changes
    useEffect(() => {
        setVerificationStatus(prev => ({
            ...prev,
            userAddress: zkLoginAddress || null,
            userDidId: null
        }));
    }, [zkLoginAddress]);

    return {
        verificationStatus,
        startListening,
        stopListening,
        resetVerification
    };
};
