"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, ChevronLeft, ExternalLink, Loader2, Shield } from "lucide-react";
import { toast } from "react-toastify";

import { apiGet, apiPost } from "@/app/utils/api-client";
import { buildApiUrl, API_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type DigiLockerPanPayload = {
  session_id: string;
  document_content_base64?: string;
  document_content_type?: string;
  document_file_name?: string;
  document_fields: {
    pan?: string;
    name?: string;
    father_name?: string;
    date_of_birth?: string;
    raw_text?: string;
  };
  profile_fields?: {
    name?: string;
    date_of_birth?: string;
    gender?: string;
    mobile?: string;
    email?: string;
  };
  document_metadata?: Record<string, string>;
};

interface DigiLockerPANStepProps {
  onNext: () => void;
  onBack: () => void;
  onDataReady: (data: {
    pan_number?: string;
    name?: string;
    father_name?: string;
    dob?: string;
    document_content_base64?: string;
    document_content_type?: string;
    document_file_name?: string;
  }) => void;
}

const DigiLockerPANStep: React.FC<DigiLockerPANStepProps> = ({ onNext, onBack, onDataReady }) => {
  const { address } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [payload, setPayload] = useState<DigiLockerPanPayload | null>(null);

  const redirectUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/kyc`;
  }, []);

  const startSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiPost<{ data: { session_id: string; authorization_url: string } }>(
        buildApiUrl(API_ENDPOINTS.DIGILOCKER_INIT_SESSION),
        {
          flow: "signin",
          doc_types: ["pan"],
          redirect_url: redirectUrl,
        },
      );

      setSessionId(result.data.session_id);
      setAuthorizationUrl(result.data.authorization_url);
      setSessionStatus("created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create DigiLocker session";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiGet<{ data: { status: string } }>(
        buildApiUrl(API_ENDPOINTS.DIGILOCKER_SESSION_STATUS(sessionId)),
      );
      setSessionStatus(result.data.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch DigiLocker session status";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPanData = async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiPost<{ data: DigiLockerPanPayload }>(
        buildApiUrl(API_ENDPOINTS.DIGILOCKER_FETCH_PAN_DATA),
        { session_id: sessionId },
      );

      setPayload(result.data);
      onDataReady({
        pan_number: result.data.document_fields.pan,
        name: result.data.document_fields.name,
        father_name: result.data.document_fields.father_name,
        dob: result.data.document_fields.date_of_birth,
        document_content_base64: result.data.document_content_base64,
        document_content_type: result.data.document_content_type,
        document_file_name: result.data.document_file_name,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch PAN data from DigiLocker";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitForAttestation = async () => {
    if (!sessionId || !payload || !address) {
      setError("Missing DigiLocker session, PAN data, or wallet connection");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await apiPost(
        buildApiUrl(API_ENDPOINTS.DIGILOCKER_CONFIRM_AND_ATTEST),
        {
          session_id: sessionId,
          user_wallet: address,
          did_id: 0,
          document_type: "pan",
          document_fields: payload.document_fields,
          profile_fields: payload.profile_fields || {},
          document_metadata: payload.document_metadata || {},
        },
      );
      toast.success("DigiLocker PAN attestation submitted");
      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit DigiLocker attestation";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">DigiLocker PAN</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">Fetch PAN directly from DigiLocker with user consent</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-error/10 border border-error/30">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-sm text-charcoal-text">{error}</p>
        </div>
      )}

      <div className="p-5 rounded-lg bg-primary/10 border border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-charcoal-text">Consent-based verification</h3>
        </div>
        <p className="text-sm text-charcoal-text/70">
          Start a DigiLocker session, complete Aadhaar OTP on the government page, then fetch the PAN details here.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={startSession} variant="primary" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start DigiLocker Session"}
        </Button>

        {authorizationUrl && (
          <Button
            onClick={() => window.open(authorizationUrl, "_blank", "noopener,noreferrer")}
            variant="secondary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open DigiLocker Consent Page
          </Button>
        )}

        {sessionId && (
          <Button onClick={checkStatus} variant="outline" disabled={isLoading}>
            Check Session Status
          </Button>
        )}

        {sessionStatus === "succeeded" && (
          <Button onClick={fetchPanData} variant="outline" disabled={isLoading}>
            Fetch PAN Data
          </Button>
        )}

        {payload && (
          <Button onClick={submitForAttestation} variant="primary" disabled={isLoading}>
            Submit For Attestation
          </Button>
        )}
      </div>

      {sessionId && (
        <div className="p-4 rounded-lg bg-white border border-primary/20">
          <p className="text-sm text-charcoal-text/70">Session ID</p>
          <p className="text-sm font-mono text-charcoal-text break-all">{sessionId}</p>
          <p className="text-sm text-charcoal-text/70 mt-3">Current Status</p>
          <p className="text-sm font-semibold text-charcoal-text">{sessionStatus || "created"}</p>
        </div>
      )}

      {payload && (
        <div className="p-5 rounded-lg bg-success/10 border border-success/30">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <h4 className="font-semibold text-charcoal-text">Fetched PAN Data</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-charcoal-text">
            <div className="p-3 rounded-lg bg-white/70">
              <span className="text-charcoal-text/60 block">PAN</span>
              <span>{payload.document_fields.pan || "-"}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/70">
              <span className="text-charcoal-text/60 block">Name</span>
              <span>{payload.document_fields.name || "-"}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/70">
              <span className="text-charcoal-text/60 block">Date of Birth</span>
              <span>{payload.document_fields.date_of_birth || "-"}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/70">
              <span className="text-charcoal-text/60 block">Issuer</span>
              <span>{payload.document_metadata?.issuer || "-"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigiLockerPANStep;
