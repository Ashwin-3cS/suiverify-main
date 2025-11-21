"use client";

import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "@/lib/sui-client";
import { ZkLoginService } from "@/lib/zklogin";
import { SessionManager } from "@/lib/session-manager";
import { ArrowRight, Send, Zap } from "lucide-react";
import { colors } from "@/app/brand";

export default function SponsoredTransactionTest() {
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [isExecuting, setIsExecuting] = useState(false);
  const [txDigest, setTxDigest] = useState("");
  const [error, setError] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [sponsorDigest, setSponsorDigest] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExecuteSponsoredTransaction = async () => {
    try {
      setIsExecuting(true);
      setError("");
      setTxDigest("");
      setSponsorDigest("");

      // Get cached address for display
      const cached = SessionManager.getCachedProof();
      if (!cached || !cached.address) {
        throw new Error(
          "No zkLogin session found. Please sign in with zkLogin first."
        );
      }

      if (!cached.ephemeralPrivateKey) {
        throw new Error(
          "Cached proof missing ephemeral private key. Please sign in again."
        );
      }

      setUserAddress(cached.address);

      // Validate receiver address
      if (
        !receiverAddress ||
        receiverAddress.length !== 66 ||
        !receiverAddress.startsWith("0x")
      ) {
        throw new Error(
          "Please enter a valid Sui address (starts with 0x, 66 characters)"
        );
      }

      // Recreate ephemeral key pair from cached proof
      const ephemeralKeyPair = ZkLoginService.recreateKeyPair(
        cached.ephemeralPrivateKey!
      );

      // Create transaction
      const tx = new Transaction();

      // Convert SUI to MIST (1 SUI = 1e9 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 1e9);

      console.log("⚡ Sponsored Transaction Test:");
      console.log("  From:", cached.address);
      console.log("  To:", receiverAddress);
      console.log("  Amount:", amount, "SUI");
      console.log("  Gas: SPONSORED by Enoki ✨");
      console.log("  Method: Get coins from sender's balance");

      // For sponsored transactions, we need to get coins from sender's balance
      // First, fetch the sender's coin objects
      const coins = await suiClient.getCoins({
        owner: cached.address,
        coinType: '0x2::sui::SUI',
      });

      if (!coins.data || coins.data.length === 0) {
        throw new Error('No SUI coins found in your address. Please get testnet SUI from the faucet first.');
      }

      // Use the first coin and split from it
      const [coin] = tx.splitCoins(tx.object(coins.data[0].coinObjectId), [
        tx.pure.u64(amountInMist),
      ]);
      tx.transferObjects([coin], tx.pure.address(receiverAddress));

      // Note: No gas budget needed for sponsored transactions
      // tx.setGasBudget(10_000_000);

      // Set sender to zkLogin address
      tx.setSender(cached.address);

      // Build the transaction with onlyTransactionKind flag for sponsorship
      console.log("📦 Building transaction for sponsorship...");
      const transactionBlockKindBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true, // Required for sponsored transactions
      });

      // Convert Uint8Array to base64 string (required by Enoki API)
      const base64TxBytes = btoa(
        String.fromCharCode.apply(null, Array.from(transactionBlockKindBytes))
      );

      console.log("📦 Transaction bytes (base64):", base64TxBytes.substring(0, 50) + "...");

      // Step 1: Create sponsored transaction via backend
      console.log("📞 Requesting sponsored transaction from backend...");
      const sponsorCreateResponse = await fetch(
        "/api/transactions/sponsor-create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionBlockKindBytes: base64TxBytes,
            sender: cached.address,
            jwtToken: cached.jwtToken, // Include JWT for zkLogin authentication
            allowedAddresses: [receiverAddress], // Dynamically allow receiver for this transaction
          }),
        }
      );

      if (!sponsorCreateResponse.ok) {
        const errorData = await sponsorCreateResponse.json();
        console.error("❌ Sponsor create error details:", errorData);
        throw new Error(
          `Failed to create sponsored transaction: ${errorData.enokiError || errorData.error || "Unknown error"}`
        );
      }

      const sponsorCreateData = await sponsorCreateResponse.json();
      const { digest, bytes } = sponsorCreateData.data;

      setSponsorDigest(digest);
      console.log("✅ Sponsored transaction created");
      console.log("   Digest:", digest);

      // Step 2: Sign the sponsored transaction bytes
      console.log("🔐 Signing sponsored transaction with ephemeral key...");
      // Convert base64 to Uint8Array (browser-compatible)
      const binaryString = atob(bytes);
      const sponsoredTxBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        sponsoredTxBytes[i] = binaryString.charCodeAt(i);
      }

      const { signature: ephemeralSignature } =
        await ephemeralKeyPair.signTransaction(sponsoredTxBytes);

      // Verify cached data
      if (!cached.jwtToken || !cached.userSalt) {
        throw new Error(
          "Cached proof is missing JWT token or user salt. Please sign in again."
        );
      }

      // Create zkLogin signature using cached proof data
      console.log("🎯 Creating zkLogin signature from cached proof...");
      const zkLoginSignature = ZkLoginService.getTransactionSignature({
        ephemeralSignature,
        useCache: true, // Use cached proof data
      });

      // Step 3: Submit signed transaction to backend for execution
      console.log("📤 Submitting signed transaction to backend...");
      const sponsorSubmitResponse = await fetch(
        "/api/transactions/sponsor-submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            digest: digest,
            signature: zkLoginSignature,
          }),
        }
      );

      if (!sponsorSubmitResponse.ok) {
        const errorData = await sponsorSubmitResponse.json();
        throw new Error(
          `Failed to submit sponsored transaction: ${errorData.error || "Unknown error"}`
        );
      }

      const sponsorSubmitData = await sponsorSubmitResponse.json();
      const transactionDigest = sponsorSubmitData.data.digest;

      console.log("✅ Sponsored transaction submitted successfully!");
      console.log("   Transaction Digest:", transactionDigest);

      // Wait for transaction to be confirmed and get full result
      console.log("⏳ Waiting for transaction confirmation...");
      const result = await suiClient.waitForTransaction({
        digest: transactionDigest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log("🎉 Sponsored Transaction Success:", result);
      setTxDigest(result.digest);
    } catch (err: unknown) {
      console.error("❌ Sponsored transaction error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Transaction failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`,
        border: `2px solid ${colors.primary}60`,
      }}
    >
      {/* Header with Sponsored Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <Zap className="w-6 h-6" style={{ color: colors.white }} />
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: colors.charcoalText }}
            >
              Sponsored Transaction Test
            </h2>
            <p className="text-sm" style={{ color: colors.charcoalText }}>
              Test gas sponsorship with zkLogin on Testnet
            </p>
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-full text-xs font-bold"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            color: colors.white,
          }}
        >
          ⚡ GAS FREE
        </div>
      </div>

      {/* Info Banner */}
      <div
        className="mb-6 p-4 rounded-lg border-l-4"
        style={{
          backgroundColor: `${colors.primary}10`,
          borderColor: colors.primary,
        }}
      >
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: colors.charcoalText }}
        >
          ✨ What's different?
        </p>
        <p className="text-xs" style={{ color: colors.charcoalText }}>
          This transaction is <strong>sponsored by Enoki</strong>. You don't
          need any SUI tokens in your wallet - the gas fees are paid for you!
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: `rgba(239, 68, 68, 0.1)`,
            borderColor: "rgb(239, 68, 68)",
          }}
        >
          <p className="text-red-600 text-sm font-semibold mb-1">❌ Error</p>
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {txDigest && (
        <div
          className="mb-6 p-4 rounded-lg border-l-4"
          style={{
            backgroundColor: `rgba(34, 197, 94, 0.1)`,
            borderColor: "rgb(34, 197, 94)",
          }}
        >
          <p className="text-green-600 text-sm font-semibold mb-2">
            🎉 Sponsored Transaction Successful!
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Gas fees were paid by Enoki - you spent 0 SUI! ⚡
          </p>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Transaction Digest:
              </p>
              <div className="flex items-center justify-between gap-2 bg-white/50 p-2 rounded">
                <p className="font-mono text-xs break-all text-gray-800">
                  {txDigest}
                </p>
                <button
                  onClick={() => copyToClipboard(txDigest)}
                  className="flex-shrink-0 p-2 hover:opacity-80 transition-opacity"
                  style={{ color: colors.primary }}
                >
                  📋
                </button>
              </div>
            </div>

            {sponsorDigest && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Sponsor Digest:
                </p>
                <div className="flex items-center justify-between gap-2 bg-white/50 p-2 rounded">
                  <p className="font-mono text-xs break-all text-gray-800">
                    {sponsorDigest}
                  </p>
                  <button
                    onClick={() => copyToClipboard(sponsorDigest)}
                    className="flex-shrink-0 p-2 hover:opacity-80 transition-opacity"
                    style={{ color: colors.primary }}
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>

          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 text-sm font-medium hover:underline"
            style={{ color: colors.primary }}
          >
            View on Explorer (Check Gas Payment!)
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}

      {/* User Address Display */}
      {userAddress && (
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: colors.charcoalText }}
          >
            Your zkLogin Address
          </label>
          <div
            className="px-4 py-2 rounded-lg font-mono text-xs"
            style={{
              backgroundColor: `${colors.primary}10`,
              color: colors.charcoalText,
            }}
          >
            {userAddress}
          </div>
        </div>
      )}

      {/* Form */}
      {!txDigest && (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.charcoalText }}
            >
              Receiver Address
            </label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-lg border-2 focus:ring-2 transition-all font-mono text-sm"
              style={{
                backgroundColor: "white",
                borderColor: `${colors.primary}30`,
                color: colors.charcoalText,
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.charcoalText }}
            >
              Amount (SUI)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0.001"
              className="w-full px-4 py-3 rounded-lg border-2 focus:ring-2 transition-all font-mono"
              style={{
                backgroundColor: "white",
                borderColor: `${colors.primary}30`,
                color: colors.charcoalText,
              }}
            />
          </div>

          <div
            className="p-4 rounded-lg text-sm"
            style={{
              backgroundColor: `rgba(34, 197, 94, 0.1)`,
              borderColor: "rgb(34, 197, 94)",
            }}
          >
            <p
              className="font-semibold mb-1"
              style={{ color: "rgb(34, 197, 94)" }}
            >
              ✅ No SUI needed!
            </p>
            <p className="text-xs" style={{ color: "rgb(21, 128, 61)" }}>
              Unlike regular transactions, you don't need testnet SUI. The gas
              is sponsored by Enoki!
            </p>
          </div>

          <button
            onClick={handleExecuteSponsoredTransaction}
            disabled={isExecuting || !receiverAddress}
            className="w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: colors.white,
            }}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Sponsored Transaction...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Send Sponsored Transaction
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
