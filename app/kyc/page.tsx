"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Commented out EOA wallet imports - using zkLogin instead
// import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '@/lib/sui-client';
import { ZkLoginService } from '@/lib/zklogin';
import { SessionManager } from '@/lib/session-manager';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Award, ExternalLink } from 'lucide-react';
import CountrySelectionStep from '@/components/features/kyc/steps/CountrySelectionStep';
import DocumentTypeSelectionStep from '@/components/features/kyc/steps/DocumentTypeSelectionStep';
import AadhaarUploadStep from '@/components/features/kyc/steps/AadhaarUploadStep';
import PANUploadStep from '@/components/features/kyc/steps/PANUploadStep';
import PANVerificationStep from '@/components/features/kyc/steps/PANVerificationStep';
import FaceVerificationStep from '@/components/features/kyc/steps/FaceVerificationStep';
import OtpVerificationStep from '@/components/features/kyc/steps/OtpVerificationStep';
import { useVerificationListener } from '@/hooks/useEventListener';
import { documentEncryptionService, DocumentEncryptionService } from '@/services/encryptionService';
import { credentialService } from '@/services/credentialService';
import { NFTClaimSuccessModal } from '@/components/NFTClaimSuccess';
import { colors } from '@/app/brand';
import { SHARED_OBJECTS, CONTRACT_FUNCTIONS, GAS_CONFIG, buildExplorerUrl } from '@/config/contracts';
import StepIndicator from '@/components/ui/StepIndicator';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import DashboardHeader from '@/components/ui/DashboardHeader';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  available: boolean;
}

interface AadhaarData {
  name?: string;
  dob?: string;
  gender?: string;
  phone_number?: string;
  address?: string;
  aadhaar_number?: string;
  aadhaar_photo_base64?: string;
}

interface PANData {
  pan_number?: string;
  name?: string;
  father_name?: string;
  dob?: string;
  pan_photo_base64?: string;
}

function KycPage() {
  const [step, setStep] = useState('country');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [panData, setPanData] = useState<PANData | null>(null);
  const [panCardImage, setPanCardImage] = useState<File | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState<{
    blobId?: string;
    encryptionId?: string;
    suiRef?: string;
  } | null>(null);
  const [userDidId, setUserDidId] = useState<string | null>(null);
  const [isClaimingNft, setIsClaimingNft] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [nftClaimData, setNftClaimData] = useState<{
    nftId: string;
    title: string;
    description: string;
    suiExplorerUrl: string;
    walrusUrl?: string;
    transactionHash: string;
    userAddress: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Commented out EOA wallet hook - using zkLogin instead
  // const currentAccount = useCurrentAccount();
  const { address: zkLoginAddress, isAuthenticated } = useAuth();
  const { verificationStatus, startListening, stopListening, resetVerification } = useVerificationListener();

  // Get verification type from URL parameters or default
  // const verificationType = searchParams.get('type') || 'Verify Above 18'; // Commented out - not used
  const verificationDescription = searchParams.get('description') || 'Verify your age using Aadhaar document. Required for DeFi protocols and Gaming protocols on SUI ecosystem.';

  // Commented out EOA transaction execution - using zkLogin instead
  // const suiClient = useSuiClient();
  // const { mutate: signAndExecute } = useSignAndExecuteTransaction({
  //   execute: async ({ bytes, signature }) =>
  //     await suiClient.executeTransactionBlock({
  //       transactionBlock: bytes,
  //       signature,
  //       options: {
  //         showRawEffects: true,
  //         showEffects: true,
  //       },
  //     }),
  // });

  // Contract configuration from centralized config
  // const PACKAGE_ID = getCurrentPackageId(); // Commented out - not used
  const CLOCK_ID = SHARED_OBJECTS.CLOCK;


  const handleNext = () => {
    if (step === 'aadhaar') setStep('face');
    else if (step === 'pan') setStep('face');
    else if (step === 'face') {
      // For PAN, go to PAN verification (no OTP)
      if (selectedDocumentType?.id === 'pan') {
        setStep('pan-verification');
      } else {
        setStep('otp');
      }
    }
    else if (step === 'pan-verification') {
      // After PAN verification, start listening for blockchain events
      setOtpVerified(true);
      setStep('waiting');
      startListening();
    }
    else if (step === 'otp') {
      // After OTP verification, start listening for blockchain events
      setOtpVerified(true);
      setStep('waiting');
      startListening();
    }
  };

  // Reset verification state when starting a new verification (step is 'country')
  useEffect(() => {
    if (step === 'country') {
      // Stop the event listener to prevent old events from triggering toasts
      stopListening();
      resetVerification();
      setOtpVerified(false);
      setEncryptionResult(null);
      setUserDidId(null);
    }
  }, [step, resetVerification, stopListening]);

  // Check wallet connection on mount and when account changes
  useEffect(() => {
    // If wallet disconnects while in verification flow, reset to country selection
    if (!zkLoginAddress && step !== 'country') {
      toast.error('Please connect wallet to continue verification', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setStep('country');
    }
  }, [zkLoginAddress, step]);

  const handleCountrySelect = (country: Country) => {
    // Check wallet connection before proceeding
    if (!zkLoginAddress) {
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
    
    setSelectedCountry(country);
    setStep('document-type');
  };

  const handleDocumentTypeSelect = (documentType: DocumentType) => {
    // Check wallet connection before proceeding
    if (!zkLoginAddress) {
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
    
    setSelectedDocumentType(documentType);
    if (documentType.id === 'aadhaar') {
      setStep('aadhaar');
    } else if (documentType.id === 'pan') {
      setStep('pan');
    }
    // Add more document types as needed
  };

  const encryptAndUploadDocument = useCallback(async (file: File) => {
    try {
      console.log('🔄 Starting real encryption and upload process...');

      const result = await documentEncryptionService.encryptAndUploadDocument(
        file,
        zkLoginAddress!
      );

      if (result.success) {
        console.log('✅ Encryption and upload successful!');
        console.log('📋 Results:', result);

        // Store the encryption results
        setEncryptionResult({
          blobId: result.blobId,
          encryptionId: result.encryptionId,
          suiRef: result.suiRef
        });

        setStep('completed');
      } else {
        console.error('Encryption failed:', result.error);
        toast.error('Document encryption failed. Please try again.', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setStep('error');
      }
    } catch (error) {
      console.error('Unexpected error during encryption:', error);
      toast.error('An unexpected error occurred. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setStep('error');
    }
  }, [zkLoginAddress]);

  const handleDocumentEncryption = useCallback(async () => {
    const photoBase64 = selectedDocumentType?.id === 'pan'
      ? panData?.pan_photo_base64
      : aadhaarData?.aadhaar_photo_base64;

    if (!photoBase64 || !zkLoginAddress) {
      console.error('Missing document data or zkLogin address');
      return;
    }

    try {
      console.log('🔐 Starting document encryption and upload process...');
      setStep('encrypting');

      // Convert base64 to File object for encryption
      const base64Data = photoBase64;
      console.log('📊 Base64 data received:', base64Data.length, 'characters');

      const byteCharacters = atob(base64Data);
      console.log('📊 Decoded byte characters:', byteCharacters.length, 'bytes');

      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      console.log('📊 Byte array created:', byteArray.length, 'bytes');
      console.log('📊 First 20 bytes (should be JPEG signature):', Array.from(byteArray.slice(0, 20)));

      const fileName = selectedDocumentType?.id === 'pan' ? 'pan-document.jpg' : 'aadhaar-document.jpg';
      const file = new File([byteArray], fileName, { type: 'image/jpeg' });

      console.log('📄 Document converted to file:', file.name, file.size, 'bytes');
      console.log('✅ Ready to encrypt FULL size image:', file.size, 'bytes');

      // Use the encryption logic from EncryptAndUpload.tsx
      await encryptAndUploadDocument(file);

    } catch (error) {
      console.error('❌ Error in document encryption:', error);
      setStep('error');
    }
  }, [selectedDocumentType?.id, panData?.pan_photo_base64, aadhaarData?.aadhaar_photo_base64, zkLoginAddress, encryptAndUploadDocument, aadhaarData, panData]);

  // Handle successful verification from event listener
  // Only process if we're in the waiting step (after OTP/PAN verification)
  useEffect(() => {
    if (verificationStatus.isVerified && otpVerified && step === 'waiting') {
      // Store the UserDID object ID from the verification event
      if (verificationStatus.userDidId) {
        setUserDidId(verificationStatus.userDidId);
        console.log('🎯 UserDID object ID captured from event:', verificationStatus.userDidId);
      }

      // Log enhanced event data for SDK verification
      if (verificationStatus.eventData) {
        console.log('📋 Enhanced Event Data Available:');
        console.log('   🔐 Nautilus Signature Length:', verificationStatus.eventData.nautilus_signature.length);
        console.log('   📅 Signature Timestamp:', verificationStatus.eventData.signature_timestamp_ms);
        console.log('   🔍 Evidence Hash Length:', verificationStatus.eventData.evidence_hash.length);
        console.log('   🆔 DID Type:', verificationStatus.eventData.did_type);
        console.log('   📋 Registry ID:', verificationStatus.eventData.registry_id);

        // This enhanced data can now be used for SDK verification calls
        // Example: await enclave.verify_signature(enclave_id, 1, parseInt(eventData.signature_timestamp_ms), payload, eventData.nautilus_signature);
      }

      // Start document encryption and upload process
      handleDocumentEncryption();
    }
  }, [verificationStatus.isVerified, otpVerified, step, verificationStatus.userDidId, verificationStatus.eventData, handleDocumentEncryption]);

  // NFT Claiming function - using zkLogin
  const claimDidNft = async () => {
    if (!encryptionResult?.blobId || !zkLoginAddress) {
      console.error('❌ Missing blob ID or zkLogin address');
      return;
    }

    if (!userDidId) {
      console.error('❌ Missing UserDID object ID from verification event');
      alert('Error: UserDID object ID not found. Please complete verification first.');
      return;
    }

    try {
      setIsClaimingNft(true);
      console.log('🏆 Starting DID NFT claim process with zkLogin...');
      console.log('🎯 Using UserDID object ID from event:', userDidId);
      console.log('🔐 zkLogin Address:', zkLoginAddress);

      // Get cached zkLogin proof
      const cached = SessionManager.getCachedProof();
      if (!cached || !cached.address) {
        throw new Error('No zkLogin session found. Please sign in first.');
      }

      if (!cached.ephemeralPrivateKey) {
        throw new Error('Cached proof missing ephemeral private key. Please sign in again.');
      }

      // Log enhanced verification data available for future SDK integration
      if (verificationStatus.eventData) {
        console.log('📋 Enhanced verification data available:');
        console.log('   📅 Signature Timestamp (ms):', verificationStatus.eventData.signature_timestamp_ms);
        console.log('   🔐 Nautilus Signature Available:', verificationStatus.eventData.nautilus_signature.length > 0);
        console.log('   🔍 Evidence Hash Available:', verificationStatus.eventData.evidence_hash.length > 0);
        console.log('   🆔 DID Type:', verificationStatus.eventData.did_type);
      }

      // Recreate ephemeral key pair from cached proof
      const ephemeralKeyPair = ZkLoginService.recreateKeyPair(cached.ephemeralPrivateKey);

      // Create transaction
      const tx = new Transaction();
      tx.moveCall({
        target: CONTRACT_FUNCTIONS.DID_REGISTRY.CLAIM_DID_NFT,
        arguments: [
          tx.object(SHARED_OBJECTS.DID_REGISTRY), // registry
          tx.object(userDidId), // user_did object (from verification event)
          tx.pure.string(encryptionResult.blobId), // blob_id
          tx.object(CLOCK_ID), // clock
        ],
      });
      tx.setGasBudget(GAS_CONFIG.NFT_CLAIM_GAS_BUDGET);

      // Set sender to zkLogin address
      tx.setSender(cached.address);

      // Build the transaction
      console.log('Building transaction...');
      const txBytes = await tx.build({ client: suiClient });

      // Sign with ephemeral key
      console.log('Signing with ephemeral key...');
      const { signature: ephemeralSignature } = await ephemeralKeyPair.signTransaction(txBytes);

      // Verify cached data
      if (!cached.jwtToken || !cached.userSalt) {
        throw new Error('Cached proof is missing JWT token or user salt. Please sign in again.');
      }

      // Create zkLogin signature using cached proof data
      console.log('Creating zkLogin signature from cached proof...');
      const zkLoginSignature = ZkLoginService.getTransactionSignature({
        ephemeralSignature,
        useCache: true, // Use cached proof data
      });

      // Execute transaction
      console.log('Executing transaction on testnet...');
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: zkLoginSignature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('🎉 NFT Claim Transaction Success:', result);

      // Extract the NFT object ID from the transaction result
      const nftObject = result.effects?.created?.find(
        (item: any) => item.owner && typeof item.owner === 'object' && 'AddressOwner' in item.owner,
      );
      const nftId = nftObject?.reference?.objectId;

      console.log('🏆 DID NFT Created:', nftId);

      if (nftId) {
        console.log('🎉 NFT Claimed Successfully! Saving to backend...');

        // Prepare NFT data for modal and backend
        const nftData = {
          nftId,
          title: 'Age Verification NFT',
          description: 'Verified above 18 years using Aadhaar document',
          suiExplorerUrl: `https://suiscan.xyz/testnet/object/${nftId}`,
          walrusUrl: encryptionResult.blobId ? `https://walrus.site/blob/${encryptionResult.blobId}` : undefined,
          transactionHash: result.digest,
          userAddress: zkLoginAddress
        };

        // Save NFT credential to backend
        try {
          const saveResult = await credentialService.saveNFTCredential({
            userAddress: zkLoginAddress,
            nftId,
            didType: userDidId || '1',
            title: 'Age Verification NFT',
            description: 'Verified above 18 years using Aadhaar document',
            suiExplorerUrl: buildExplorerUrl(nftId, 'object'),
            walrusUrl: encryptionResult.blobId ? `https://walrus.site/blob/${encryptionResult.blobId}` : undefined,
            blobId: encryptionResult.blobId,
            transactionHash: result.digest
          });

          if (saveResult.success) {
            console.log('✅ NFT credential saved to backend:', saveResult.credentialId);
          } else {
            console.error('❌ Failed to save NFT credential:', saveResult.error);
          }
        } catch (error) {
          console.error('❌ Error saving NFT credential to backend:', error);
        }

        // Show success modal
        setNftClaimData(nftData);
        setShowSuccessModal(true);
        setStep('nft-claimed');
      }
    } catch (error: any) {
      console.error('❌ Error claiming NFT:', error);
      alert(`Error claiming NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClaimingNft(false);
    }
  };

  const handleBack = () => {
    if (step === 'document-type') setStep('country');
    else if (step === 'aadhaar' || step === 'pan') setStep('document-type');
    else if (step === 'face') {
      if (selectedDocumentType?.id === 'aadhaar') setStep('aadhaar');
      else if (selectedDocumentType?.id === 'pan') setStep('pan');
    }
    else if (step === 'pan-verification') setStep('face');
    else if (step === 'otp') setStep('face');
    else if (step === 'country') router.push("/dashboard");
  };

  const handleAadhaarUpload = (data: AadhaarData) => {
    setAadhaarData(data);
  };

  const handlePANUpload = (data: PANData, file?: File) => {
    setPanData(data);
    if (file) {
      setPanCardImage(file);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ghost-white outfit">
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

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-8">
          <div className="text-center max-w-5xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <motion.h1
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl md:text-5xl font-bold mb-3"
              >
                <p className=' bg-primary text-white p-4 rounded-lg w-fit mx-auto'>Identity Verification</p>
              </motion.h1>

              {/* <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl mb-2"
                style={{ color: colors.white }}
              >
                {verificationType}
              </motion.p> */}

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-base md:text-lg max-w-2xl mx-auto mb-6 text-charcoal-text/70"
              >
                {verificationDescription}
              </motion.p>
            </motion.div>

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-[3px] border-primary/20 max-w-4xl mx-auto"
            >
            {/* Step Indicator */}
            {!['waiting', 'encrypting', 'completed', 'error', 'nft-claimed'].includes(step) && (
              <div className="mb-6 pb-6 border-b border-primary/20">
                <StepIndicator
                  steps={(() => {
                    const baseSteps = [
                      { id: 'country', label: 'Region', description: 'Select country' },
                      { id: 'document-type', label: 'Select Document', description: 'Choose type' },
                    ];
                    
                    if (selectedDocumentType?.id === 'pan') {
                      return [
                        ...baseSteps,
                        { id: 'pan', label: 'Upload', description: 'Upload PAN' },
                        { id: 'face', label: 'Biometric', description: 'Face verification' },
                        { id: 'pan-verification', label: 'Verify', description: 'Final step' },
                      ];
                    } else {
                      return [
                        ...baseSteps,
                        { id: 'aadhaar', label: 'Upload', description: 'Upload Aadhaar' },
                        { id: 'face', label: 'Biometric', description: 'Face verification' },
                        { id: 'otp', label: 'OTP', description: 'Verify OTP' },
                      ];
                    }
                  })()}
                  currentStep={step}
                />
              </div>
            )}
              {step === 'country' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CountrySelectionStep
                    onNext={handleCountrySelect}
                    onBack={handleBack}
                  />
                </motion.div>
              )}
              {step === 'document-type' && selectedCountry && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <DocumentTypeSelectionStep
                    country={selectedCountry}
                    onNext={handleDocumentTypeSelect}
                    onBack={handleBack}
                  />
                </motion.div>
              )}
              {step === 'aadhaar' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AadhaarUploadStep
                    onNext={handleNext}
                    onBack={handleBack}
                    onFileUpload={handleAadhaarUpload}
                  />
                </motion.div>
              )}
              {step === 'pan' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <PANUploadStep
                    onNext={handleNext}
                    onBack={handleBack}
                    onFileUpload={handlePANUpload}
                  />
                </motion.div>
              )}
              {step === 'face' && (aadhaarData || panData) && (
                <FaceVerificationStep
                  onNext={handleNext}
                  onBack={handleBack}
                  panData={panData || {
                    name: aadhaarData?.name,
                    dob: aadhaarData?.dob,
                    father_name: undefined,
                    pan_number: undefined,
                    pan_photo_base64: aadhaarData?.aadhaar_photo_base64
                  }}
                  panCardImage={panCardImage}
                />
              )}
              {step === 'pan-verification' && panData && (
                <PANVerificationStep
                  onNext={handleNext}
                  onBack={handleBack}
                  panData={panData}
                />
              )}
              {step === 'otp' && aadhaarData && (
                <OtpVerificationStep
                  onNext={handleNext}
                  onBack={handleBack}
                  phoneNumber={aadhaarData.phone_number || ''}
                  aadhaarData={aadhaarData}
                />
              )}
              {step === 'waiting' && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                  >
                    <div className="w-20 h-20 border-4 rounded-full animate-spin mx-auto mb-6"
                      style={{ borderColor: `${colors.primary}20`, borderTopColor: colors.primary }}></div>
                    <h2 className="text-2xl font-bold mb-3 text-charcoal-text">
                      Waiting for Blockchain Verification
                    </h2>
                    <p className="text-lg mb-6 text-charcoal-text/70">
                      {selectedDocumentType?.id === 'pan' 
                        ? 'Your PAN verification has been submitted. Now waiting for on-chain attestation...'
                        : 'Your OTP has been verified. Now waiting for on-chain attestation...'
                      }
                    </p>
                  </motion.div>

                  {zkLoginAddress && (
                    <div className="rounded-2xl p-4 mb-6 bg-primary/10 border border-primary/30 hidden">
                      <p className="text-sm mb-2 text-charcoal-text">
                        <strong>Listening for address:</strong>
                      </p>
                      <p className="text-xs font-mono px-3 py-2 rounded-lg bg-white border border-primary/20 text-charcoal-text">
                        {zkLoginAddress}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl p-4 bg-white border border-primary/20 hidden">
                    <p className="text-sm mb-2 text-charcoal-text">
                      <strong>Event Listener Status:</strong>
                    </p>
                    <p className="text-sm text-charcoal-text/70">
                      {verificationStatus.verificationMessage || 'Initializing...'}
                    </p>

                    {verificationStatus.isVerified && (
                      <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30">
                        <p className="font-semibold mb-2 text-charcoal-text">
                          ✅ Verification completed from event listener!
                        </p>
                        <p className="text-sm mb-3 text-charcoal-text/70">
                          Starting document encryption process...
                        </p>

                        {verificationStatus.eventData && (
                          <div className="mt-3 p-3 rounded-lg text-xs bg-white border border-primary/20">
                            <p className="font-semibold mb-2 text-charcoal-text">Enhanced Event Data:</p>
                            <div className="space-y-1 text-charcoal-text/70">
                              <p>🆔 DID Type: {verificationStatus.eventData.did_type}</p>
                              <p>📅 Signature Time: {new Date(parseInt(verificationStatus.eventData.signature_timestamp_ms)).toLocaleString()}</p>
                              <p>🔐 Nautilus Signature: {verificationStatus.eventData.nautilus_signature.length > 0 ? '✅ Available' : '❌ Missing'}</p>
                              <p>🔍 Evidence Hash: {verificationStatus.eventData.evidence_hash.length > 0 ? '✅ Available' : '❌ Missing'}</p>
                            </div>
                            <p className="text-sm mt-2 text-primary">Ready for SDK verification calls!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === 'encrypting' && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                  >
                    <div className="w-20 h-20 border-4 rounded-full animate-spin mx-auto mb-6"
                      style={{ borderColor: `${colors.primary}20`, borderTopColor: colors.primary }}></div>
                    <h2 className="text-2xl font-bold mb-3 text-charcoal-text">
                      Encrypting Documents
                    </h2>
                    <p className="text-lg mb-6 text-charcoal-text/70">
                      Converting documents to secure encrypted format...
                    </p>
                  </motion.div>
                </div>
              )}

              {step === 'completed' && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: `${colors.primary}20`, border: `2px solid ${colors.primary}` }}>
                      <svg className="w-10 h-10" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-charcoal-text">
                      Verification Complete!
                    </h2>
                    <p className="text-lg mb-6 text-charcoal-text/70">
                      Your documents have been encrypted and stored securely.
                    </p>
                  </motion.div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={claimDidNft}
                        disabled={isClaimingNft || !encryptionResult?.blobId}
                        variant="primary"
                        className="flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 border-[3px] shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em]"
                      >
                        <Award className="w-5 h-5 mr-2" />
                        {isClaimingNft ? 'Claiming NFT...' : 'Claim Your DID NFT'}
                      </Button>
                      
                      {encryptionResult?.suiRef && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1"
                        >
                          <Button
                            onClick={() => {
                              window.open(
                                DocumentEncryptionService.getSuiExplorerUrl(encryptionResult.suiRef!, 'object'),
                                '_blank',
                                'noopener,noreferrer'
                              );
                            }}
                            variant="secondary"
                            className="w-full py-4"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                          </Button>
                        </motion.div>
                      )}
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                        className="w-full"
                      >
                        Go to Dashboard
                      </Button>
                    </motion.div>
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: `${colors.primary}20`, border: `2px solid #ef4444` }}>
                      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-charcoal-text">
                      Process Failed
                    </h2>
                    <p className="text-lg mb-6 text-charcoal-text/70">
                      There was an error during the document encryption process.
                    </p>
                  </motion.div>

                  <Button
                    onClick={() => setStep('waiting')}
                    variant="primary"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* NFT Claim Success Modal */}
      {showSuccessModal && nftClaimData && (
        <NFTClaimSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setNftClaimData(null);
            // Navigate to user dashboard to see the new credential
            router.push('/dashboard');
          }}
          nftData={nftClaimData}
        />
      )}
    </div>
  );
}

export default KycPage;
