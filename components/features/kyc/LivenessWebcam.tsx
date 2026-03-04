import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivenessWebcamProps {
  onVerified: (base64Image: string) => void;
  onError: (error: string) => void;
}

const API_BASE = "http://localhost:8000/api/liveness";
const FRAME_SKIP = 2;

export const LivenessWebcam: React.FC<LivenessWebcamProps> = ({
  onVerified,
  onError,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [instruction, setInstruction] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(3);
  const [scoreLabel, setScoreLabel] = useState("Detection Score");
  const [scoreValue, setScoreValue] = useState("0.00");
  const [scorePercent, setScorePercent] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isPassiveScan, setIsPassiveScan] = useState(true);

  const frameCountRef = useRef(0);
  const isProcessingRef = useRef(false);
  const [lastImage, setLastImage] = useState<string | null>(null);

  // Restart the session fully
  const resetSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/reset-session`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Reset session failed");
      setIsVerified(false);
      setLastImage(null);
      setStatusMsg("New session started");
      setStatusType("");
      setIsRunning(true);
    } catch (err: any) {
      console.error(err);
      setStatusMsg("Reset failed");
      setStatusType("error");
    }
  }, []);

  useEffect(() => {
    resetSession();
    return () => {
      setIsRunning(false);
    };
  }, [resetSession]);

  const sendFrame = useCallback(async () => {
    if (!isRunning || isVerified || isProcessingRef.current) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    isProcessingRef.current = true;

    try {
      const b64 = imageSrc.includes(",") ? imageSrc.split(",")[1] : imageSrc;

      const response = await fetch(`${API_BASE}/check-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame_base64: b64 }),
      });

      if (!response.ok) throw new Error("API error");
      const { data } = await response.json();

      if (!data) return;

      const ch = data.challenge || {};
      const isLive = data.is_live;

      setInstruction(ch.instruction || "Waiting...");
      setProgress(ch.progress || 0);
      setTotal(ch.total !== undefined ? ch.total : 3);
      setIsPassiveScan(ch.passive_active);
      setIsCalibrating(ch.calibrating);

      if (ch.passive_active) {
        setScoreLabel("Analyzing Depth & Texture");
        setScoreValue("SCANNING");
        setScorePercent(100);
      } else {
        setScoreLabel("Detection Score");
        let scoreVal = 0;
        if (ch.blink_score !== null && ch.blink_score !== undefined) {
          scoreVal = ch.blink_score;
        } else if (ch.mouth_score !== null && ch.mouth_score !== undefined) {
          scoreVal = ch.mouth_score;
        }
        setScoreValue(scoreVal.toFixed(2));
        setScorePercent(scoreVal * 100);
      }

      if (!data.face_detected) {
        setStatusMsg("No face detected — move closer");
        setStatusType("error");
      } else if (ch.all_complete) {
        setStatusMsg("All challenges completed!");
        setStatusType("success");
      } else {
        setStatusMsg("Awaiting challenge...");
        setStatusType("");
      }

      if (isLive && !isVerified) {
        setIsVerified(true);
        setIsRunning(false); // Stop loop
        setLastImage(imageSrc);
        setTimeout(() => {
          onVerified(imageSrc);
        }, 1500); // Give user time to see success
      }
    } catch (err: any) {
      console.error("Frame send error:", err);
      // Don't kill loop on intermittent network error
    } finally {
      isProcessingRef.current = false;
    }
  }, [isRunning, isVerified, onVerified]);

  // RequestAnimationFrame loop
  useEffect(() => {
    let animationFrameId: number;

    const processLoop = () => {
      if (!isRunning) return;

      frameCountRef.current += 1;
      if (
        frameCountRef.current % FRAME_SKIP === 0 &&
        !isProcessingRef.current
      ) {
        sendFrame();
      }
      animationFrameId = requestAnimationFrame(processLoop);
    };

    if (isRunning) {
      animationFrameId = requestAnimationFrame(processLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, sendFrame]);

  if (lastImage && isVerified) {
    return (
      <div className="relative">
        <img
          src={lastImage}
          alt="Verified face"
          className="w-full rounded-lg border-2 border-success"
        />
        <div className="absolute inset-0 bg-success/20 flex items-center justify-center rounded-lg">
          <div className="bg-white/90 p-4 rounded-xl shadow-lg flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-success mb-2" />
            <h4 className="font-bold text-success text-center">
              Verified Human
            </h4>
            <p className="text-sm text-charcoal-text/70">Proceeding...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full rounded-lg border-2 border-primary/30"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
      />
      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
        Live
      </div>

      <div className="mt-4 bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
        <div className="text-xs uppercase text-primary font-bold tracking-wider mb-2">
          Current Challenge
        </div>
        <div className="text-lg font-bold text-charcoal-text mb-4 leading-tight">
          {instruction}
        </div>

        <div className="flex gap-2 justify-center mb-4">
          {isPassiveScan ? (
            <div className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
              Security Scan in Progress...
            </div>
          ) : total > 0 ? (
            Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < progress
                    ? "bg-success text-white border-success"
                    : i === progress
                      ? "bg-primary text-white scale-110 shadow-[0_0_0_4px_rgba(102,126,234,0.2)]"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
            ))
          ) : null}
        </div>

        {isCalibrating && (
          <div className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold mb-3">
            ⚙️ Calibrating head position... Hold still
          </div>
        )}

        {/* Score Bar */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex justify-between items-center mb-3 text-left">
          <div className="flex-1 pr-4">
            <div className="text-xs uppercase text-gray-400 font-semibold mb-1">
              {scoreLabel}
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, scorePercent))}%`,
                  background: isPassiveScan
                    ? "linear-gradient(90deg, #90caf9, #1976d2)"
                    : "linear-gradient(90deg, #667eea, #764ba2)",
                }}
              />
            </div>
          </div>
          <div className="text-lg font-bold text-primary">{scoreValue}</div>
        </div>

        <div
          className={`text-sm min-h-[20px] ${statusType === "error" ? "text-error font-semibold" : statusType === "success" ? "text-success font-semibold" : "text-gray-500"}`}
        >
          {statusMsg}
        </div>
      </div>
    </div>
  );
};
