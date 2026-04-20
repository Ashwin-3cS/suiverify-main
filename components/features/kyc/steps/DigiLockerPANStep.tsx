"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ExternalLink, Loader2, Shield } from "lucide-react";
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
  profile_fields?: Record<string, unknown>;
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

type Phase = "idle" | "starting" | "awaiting_consent" | "polling" | "attesting" | "done" | "error";

const DigiLockerPANStep: React.FC<DigiLockerPANStepProps> = ({ onNext, onBack, onDataReady }) => {
  const { address } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attestingRef = useRef<boolean>(false);

  const redirectUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/kyc/digilocker-callback`;
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const runAttestation = async (sid: string) => {
    setPhase("attesting");
    const fetched = await apiPost<{ data: DigiLockerPanPayload }>(
      buildApiUrl(API_ENDPOINTS.DIGILOCKER_FETCH_PAN_DATA),
      { session_id: sid },
    );
    onDataReady({
      pan_number: fetched.data.document_fields.pan,
      name: fetched.data.document_fields.name,
      father_name: fetched.data.document_fields.father_name,
      dob: fetched.data.document_fields.date_of_birth,
      document_content_base64: fetched.data.document_content_base64,
      document_content_type: fetched.data.document_content_type,
      document_file_name: fetched.data.document_file_name,
    });

    await apiPost(
      buildApiUrl(API_ENDPOINTS.DIGILOCKER_CONFIRM_AND_ATTEST),
      { session_id: sid, user_wallet: address, did_id: 0 },
    );
    setPhase("done");
    toast.success("DigiLocker verification submitted");
    onNext();
  };

  const startPolling = (sid: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setPhase("polling");

    pollTimerRef.current = setInterval(async () => {
      try {
        const popupClosed = popupRef.current?.closed ?? false;
        const statusResp = await apiGet<{ data: { status: string } }>(
          buildApiUrl(API_ENDPOINTS.DIGILOCKER_SESSION_STATUS(sid)),
        );
        const status = statusResp.data.status;

        if (status === "succeeded") {
          if (attestingRef.current) return;
          attestingRef.current = true;
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          try {
            popupRef.current?.close();
          } catch {}
          await runAttestation(sid);
        } else if (popupClosed && status !== "succeeded") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPhase("error");
          setError("Consent tab closed before completion");
          toast.error("Consent not completed");
        }
      } catch (err) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        const message = err instanceof Error ? err.message : "Verification failed";
        setPhase("error");
        setError(message);
        toast.error(message);
      }
    }, 2500);
  };

  const startFlow = async () => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }
    try {
      setError(null);
      attestingRef.current = false;
      setPhase("starting");
      const result = await apiPost<{ data: { session_id: string; authorization_url: string } }>(
        buildApiUrl(API_ENDPOINTS.DIGILOCKER_INIT_SESSION),
        { flow: "signin", doc_types: ["pan"], redirect_url: redirectUrl },
      );
      setSessionId(result.data.session_id);
      setAuthorizationUrl(result.data.authorization_url);

      popupRef.current = window.open(result.data.authorization_url, "_blank", "noopener,noreferrer,width=540,height=720");
      setPhase("awaiting_consent");
      startPolling(result.data.session_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start DigiLocker session";
      setPhase("error");
      setError(message);
      toast.error(message);
    }
  };

  const phaseMessage: Record<Phase, string> = {
    idle: "Start the DigiLocker flow. A new tab will open for consent.",
    starting: "Creating DigiLocker session...",
    awaiting_consent: "Complete consent in the DigiLocker tab. We will continue automatically.",
    polling: "Waiting for DigiLocker consent...",
    attesting: "Consent received. Submitting attestation...",
    done: "Attestation submitted.",
    error: error ?? "Something went wrong.",
  };

  const busy = phase === "starting" || phase === "awaiting_consent" || phase === "polling" || phase === "attesting";

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg transition-colors hover:bg-primary/10 bg-primary/5"
          disabled={busy}
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text">DigiLocker Verification</h2>
          <p className="text-sm text-charcoal-text/60 mt-1">
            Consent-based identity verification via DigiLocker
          </p>
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
          <h3 className="font-semibold text-charcoal-text">{phaseMessage[phase]}</h3>
        </div>
        {phase === "awaiting_consent" || phase === "polling" ? (
          <p className="text-sm text-charcoal-text/70">
            If the DigiLocker tab did not open, use the button below. The tab will close itself once consent is granted.
          </p>
        ) : (
          <p className="text-sm text-charcoal-text/70">
            You will be asked for Aadhaar OTP consent on the government page. No document upload needed.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {phase === "idle" || phase === "error" ? (
          <Button onClick={startFlow} variant="primary" disabled={!address}>
            Start DigiLocker Verification
          </Button>
        ) : (
          <Button variant="primary" disabled>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {phaseMessage[phase]}
          </Button>
        )}

        {authorizationUrl && phase === "awaiting_consent" && (
          <Button
            onClick={() => {
              popupRef.current = window.open(authorizationUrl, "_blank", "noopener,noreferrer,width=540,height=720");
            }}
            variant="secondary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Reopen DigiLocker Consent
          </Button>
        )}
      </div>

      {sessionId && (
        <p className="text-xs text-charcoal-text/50 font-mono break-all">Session: {sessionId}</p>
      )}
    </div>
  );
};

export default DigiLockerPANStep;
