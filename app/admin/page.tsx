"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { SessionKey } from '@mysten/seal';
import { AlertCircle, FileText, Shield, Search, Download, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '@/app/brand';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { Button } from '@/components/ui/button';
import { documentDecryptionService, DocumentDecryptionService, type DocumentMetadata } from '@/services/decryptionService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { logger } from '@/lib/logger';

interface DecryptionData {
  user_address: string;
  government_wallet: string;
  total_documents: number;
  documents: DocumentMetadata[];
}

function GovernmentDecryptionPage() {
  const [userAddress, setUserAddress] = useState('');
  const [decryptionData, setDecryptionData] = useState<DecryptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState('');
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  
  const currentAccount = useCurrentAccount();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/adminLogin');
    }
  }, [router]);

  const fetchDecryptionData = async () => {
    if (!userAddress.trim() || !currentAccount?.address) {
      setError('Please enter a user address and connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.log(' Fetching decryption data for user:', userAddress);
      logger.log(' Government wallet:', currentAccount.address);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ENCRYPTION_GOVERNMENT_DECRYPTION_DATA(userAddress, currentAccount.address)),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`);
      }

      const data: DecryptionData = await response.json();
      setDecryptionData(data);
      logger.log(' Decryption data loaded:', data);

    } catch (error) {
      console.error(' Failed to fetch decryption data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch decryption data');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelection = (blobId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, blobId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== blobId));
    }
  };

  const decryptSelectedDocuments = async () => {
    if (!selectedDocuments.length || !decryptionData || !currentAccount?.address) {
      setError('Please select documents and connect your wallet');
      return;
    }

    try {
      setIsDecrypting(true);
      setError(null);
      setDecryptionProgress('Preparing decryption...');
      
      logger.log(' Starting decryption process...');
      logger.log(' Selected documents:', selectedDocuments.length);
      logger.log(' Government wallet:', currentAccount.address);
      
      // Filter selected documents from the full list
      const documentsToDecrypt = decryptionData.documents.filter(
        doc => selectedDocuments.includes(doc.blob_id)
      );
      
      logger.log(' Documents to decrypt:', documentsToDecrypt.map(d => ({
        file_name: d.file_name,
        blob_id: d.blob_id,
        encryption_id: d.encryption_id
      })));

      // Check if we have a valid session key that hasn't expired
      if (currentSessionKey && !currentSessionKey.isExpired() && 
          currentSessionKey.getAddress() === currentAccount.address) {
        logger.log(' Using existing session key');
        
        // Use existing session key
        const result = await documentDecryptionService.downloadAndDecryptDocuments(
          documentsToDecrypt,
          currentSessionKey,
          setDecryptionProgress
        );
        
        if (result.success && result.decryptedFileUrls) {
          logger.log(' Decryption completed successfully!');
          setDecryptedFileUrls(result.decryptedFileUrls);
          setIsDialogOpen(true);
          setDecryptionProgress('Decryption completed!');
        } else {
          throw new Error(result.error || 'Decryption failed');
        }
      } else {
        // Need to create and sign a new session key
        logger.log(' Creating new session key...');
        setDecryptionProgress('Creating session key for decryption...');
        
        const sessionKey = await documentDecryptionService.createSessionKey(currentAccount.address);
        
        // Request personal message signature
        signPersonalMessage(
          {
            message: sessionKey.getPersonalMessage(),
          },
          {
            onSuccess: async (result) => {
              try {
                logger.log(' Personal message signed successfully');
                setDecryptionProgress('Signature obtained, starting decryption...');
                
                // Set the signature on the session key
                await sessionKey.setPersonalMessageSignature(result.signature);
                setCurrentSessionKey(sessionKey);
                
                // Now decrypt with the signed session key
                const decryptResult = await documentDecryptionService.downloadAndDecryptDocuments(
                  documentsToDecrypt,
                  sessionKey,
                  setDecryptionProgress
                );
                
                if (decryptResult.success && decryptResult.decryptedFileUrls) {
                  logger.log(' Decryption completed successfully!');
                  logger.log(' Decrypted files:', decryptResult.decryptedFileUrls.length);
                  setDecryptedFileUrls(decryptResult.decryptedFileUrls);
                  setIsDialogOpen(true);
                  setDecryptionProgress('Decryption completed!');
                } else {
                  throw new Error(decryptResult.error || 'Decryption failed');
                }
              } catch (error) {
                console.error(' Error after signature:', error);
                setError(`Error during decryption: ${error instanceof Error ? error.message : String(error)}`);
                setDecryptionProgress('');
              }
            },
            onError: (error) => {
              console.error(' Error during signing:', error);
              setError(`Error during signing: ${error.message}`);
              setDecryptionProgress('');
              setIsDecrypting(false);
            }
          }
        );
      }
      
    } catch (error) {
      console.error(' Decryption failed:', error);
      setError(error instanceof Error ? error.message : 'Decryption failed');
      setDecryptionProgress('');
    } finally {
      setIsDecrypting(false);
    }
  };

  const downloadDecryptedFile = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const closeDialog = () => {
    // Clean up object URLs to prevent memory leaks
    DocumentDecryptionService.cleanupBlobUrls(decryptedFileUrls);
    setDecryptedFileUrls([]);
    setIsDialogOpen(false);
  };

  return (
    <div className="w-full bg-ghost-white outfit relative min-h-screen overflow-hidden">
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
      
      {/* Hero Section */}
      <div className="relative z-10 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold mb-3 bg-primary text-white p-4 rounded-lg w-fit mx-auto"
            >
              Government Document Access
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base text-charcoal-text/70 max-w-2xl mx-auto"
            >
              Access encrypted user documents for verification purposes
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* User Document Lookup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-[3px] border-primary/30 shadow-[0.1em_0.1em] p-6 sm:p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-primary/15">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal-text">User Document Lookup</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="userAddress" className="block text-sm font-medium mb-2 text-charcoal-text">
                User Wallet Address
              </label>
              <input
                type="text"
                id="userAddress"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="Enter user's Sui wallet address (0x...)"
                className="w-full px-4 py-3 rounded-xl text-charcoal-text placeholder-gray-400 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all border-2 border-primary/30 bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchDecryptionData}
                disabled={loading || !currentAccount?.address}
                className="flex items-center gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Fetch Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-8 flex items-center gap-3 border-2 border-error bg-error/10"
          >
            <div className="p-2 rounded-lg bg-error/20">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <p className="font-medium text-charcoal-text">{error}</p>
          </motion.div>
        )}
        
        {/* Progress Display */}
        {decryptionProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-8 flex items-center gap-3 border-2 border-primary/40 bg-primary/10"
          >
            <div className="p-2 rounded-lg bg-primary/20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
            <p className="font-medium text-charcoal-text">{decryptionProgress}</p>
          </motion.div>
        )}

        {/* Documents List */}
        {decryptionData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-[3px] border-primary/30 shadow-[0.1em_0.1em] p-6 sm:p-8 mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/15">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-charcoal-text">
                    Accessible Documents ({decryptionData.total_documents})
                  </h3>
                  <p className="text-sm mt-1 text-charcoal-text/70">Select documents to decrypt and view</p>
                </div>
              </div>
              <Button
                onClick={decryptSelectedDocuments}
                disabled={!selectedDocuments.length || !currentAccount?.address || isDecrypting}
                className="flex items-center gap-2"
                size="lg"
              >
                {isDecrypting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Decrypt Documents ({selectedDocuments.length})
                  </>
                )}
              </Button>
            </div>

            {decryptionData.documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-charcoal-text/40" />
                <p className="text-lg text-charcoal-text">
                  No accessible documents found for this user address
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {decryptionData.documents.map((doc, index) => (
                  <motion.div
                    key={doc.blob_id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="rounded-2xl p-6 transition-all duration-300 flex flex-col h-full bg-white border-[3px] border-primary/30 shadow-[0.1em_0.1em]"
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        id={`doc-${index}`}
                        checked={selectedDocuments.includes(doc.blob_id)}
                        onChange={(e) => handleDocumentSelection(doc.blob_id, e.target.checked)}
                        className="mt-1 h-5 w-5 rounded flex-shrink-0 cursor-pointer"
                        style={{ accentColor: colors.primary }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h4 className="font-bold text-lg mb-3 text-charcoal-text">{doc.file_name}</h4>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between py-2 border-b border-primary/10">
                            <span className="text-xs font-medium text-charcoal-text/60 uppercase tracking-wider">Document Type</span>
                            <span className="font-semibold text-sm text-charcoal-text capitalize">{doc.document_type}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-primary/10">
                            <span className="text-xs font-medium text-charcoal-text/60 uppercase tracking-wider">DID Type</span>
                            <span className="font-semibold text-sm text-charcoal-text">{doc.did_type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs font-medium text-charcoal-text/60 uppercase tracking-wider">Created</span>
                            <span className="font-semibold text-sm text-charcoal-text">{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <a
                              href={doc.sui_explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <Search className="w-4 h-4" />
                              View on Explorer
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Decrypted Files Dialog */}
        {isDialogOpen && decryptedFileUrls.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl p-6 max-w-6xl max-h-[90vh] overflow-auto border-[3px] border-primary/30 bg-white shadow-[0.1em_0.1em]"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-primary/30">
                <h3 className="text-2xl font-bold text-charcoal-text">Decrypted Documents</h3>
                <Button
                  onClick={closeDialog}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="mb-4 text-charcoal-text/70">
                These documents have been successfully decrypted using Seal protocol and are only visible to authorized government personnel.
              </p>
              
              <div className="grid gap-4">
                {decryptedFileUrls.map((url, index) => {
                  const selectedDoc = decryptionData?.documents.filter(
                    doc => selectedDocuments.includes(doc.blob_id)
                  )[index];
                  return (
                    <div key={index} className="rounded-2xl p-6 border-[3px] border-primary/30 bg-white shadow-[0.1em_0.1em]">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-bold text-lg mb-1 text-charcoal-text">
                            {selectedDoc?.file_name || `Document ${index + 1}`}
                          </h4>
                          {selectedDoc && (
                            <p className="text-xs text-charcoal-text/70">
                              {selectedDoc.document_type} • {selectedDoc.did_type}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => downloadDecryptedFile(
                            url, 
                            selectedDoc?.file_name || `decrypted-document-${index + 1}.jpg`
                          )}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                      <div className="w-full mb-4">
                        <img 
                          src={url} 
                          alt={`Decrypted document ${index + 1}`} 
                          className="w-full h-auto border-2 border-primary/30 rounded-2xl"
                        />
                      </div>
                      {selectedDoc && (
                        <div className="rounded-xl p-4 border-2 border-primary/30 bg-ghost-white space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-charcoal-text/70">Document Type:</span>
                            <span className="font-semibold text-charcoal-text">{selectedDoc.document_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-charcoal-text/70">DID Type:</span>
                            <span className="font-semibold text-charcoal-text">{selectedDoc.did_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-charcoal-text/70">Verification Status:</span>
                            <span className="font-semibold text-charcoal-text">{selectedDoc.verification_status || 'Pending'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button
                  onClick={closeDialog}
                  variant="outline"
                  size="lg"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GovernmentDecryptionPage;