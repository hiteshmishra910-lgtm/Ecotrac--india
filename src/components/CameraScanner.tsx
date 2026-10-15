import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Trash2,
  Upload,
  Info,
  Scale,
  ShieldAlert,
  HelpCircle,
  Video,
} from 'lucide-react';
import {
  WasteCategory,
  WASTE_CATEGORIES,
  CATEGORY_COLORS,
  AIClassificationResult,
  Pickup,
} from '../lib/types';
import { saveWasteScanRecord } from '../lib/supabase';

interface CameraScannerProps {
  collectorId: string;
  activePickups: Pickup[];
  selectedPickupId?: string;
  onScanSaved?: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  collectorId,
  activePickups,
  selectedPickupId: initialPickupId,
  onScanSaved,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // AI & Workflow states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);

  // Form adjustments by collector
  const [confirmedCategory, setConfirmedCategory] = useState<WasteCategory>('Plastic');
  const [quantity, setQuantity] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(0.2);
  const [associatedPickupId, setAssociatedPickupId] = useState<string>(initialPickupId || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // GPS Location
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    addressText?: string;
  } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);

  // Initialize GPS on load
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          addressText: `GPS: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        });
        setLocating(false);
        setLocationDenied(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocating(false);
        setLocationDenied(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Stop Camera Stream and clean up all media tracks
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setIsStartingCamera(false);
  }, []);

  // Stop camera tracks on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start Camera Stream
  const startCamera = async (targetFacingMode?: 'environment' | 'user') => {
    setCameraError(null);
    setIsStartingCamera(true);

    const activeFacing = targetFacingMode || facingMode;

    try {
      // 1. Verify Secure Context (HTTPS or localhost)
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        throw new Error(
          'Insecure Context: Camera access requires a secure connection (HTTPS). Please open this app over HTTPS or localhost.'
        );
      }

      // 2. Verify browser supports mediaDevices.getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Unsupported Browser: Your browser does not support navigator.mediaDevices.getUserMedia. Please update to the latest Google Chrome, Microsoft Edge, or Firefox.'
        );
      }

      // 3. Stop any existing camera stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      // 4. Request camera stream with preferred constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: activeFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (constraintErr: any) {
        // Fallback to basic video constraint if overconstrained
        console.warn('Overconstrained error, falling back to generic video stream:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // 5. Store active stream reference
      mediaStreamRef.current = stream;

      // 6. Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Autoplay may have been deferred:', playErr);
        }
      }

      setStreamActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera: ' + (err?.message || 'Unknown error');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage =
          'Camera Permission Denied: Click the padlock or camera icon in the Google Chrome address bar, change Camera to "Allow", and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage =
          'Camera Already in Use: Another application (such as Zoom, Teams, Windows Camera, or another browser tab) is currently using your webcam. Please close it and retry.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage =
          'Missing Camera: No webcam or camera hardware detected. Please ensure your camera is plugged in and enabled in Windows Device Manager.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage =
          'Camera Constraints Error: The requested camera resolution or facing mode is not supported by your hardware.';
      } else if (err.name === 'SecurityError') {
        errorMessage =
          'Security Policy Error: Camera access was blocked by browser frame policy. Ensure camera permissions are granted.';
      }

      setCameraError(errorMessage);
      stopCamera();
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Re-attach stream if video element re-rendered while active
  useEffect(() => {
    if (streamActive && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch((e) => console.warn('Play error:', e));
      }
    }
  }, [streamActive]);

  // Flip between environment (back) and user (front) cameras
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    await startCamera(nextFacing);
  };

  // Capture frame from video to canvas, produce Blob/File, and send to backend
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const rawWidth = video.videoWidth || 640;
    const rawHeight = video.videoHeight || 480;
    const maxDim = 1280;

    let targetWidth = rawWidth;
    let targetHeight = rawHeight;
    if (rawWidth > maxDim || rawHeight > maxDim) {
      if (rawWidth > rawHeight) {
        targetHeight = Math.round((rawHeight * maxDim) / rawWidth);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((rawWidth * maxDim) / rawHeight);
        targetHeight = maxDim;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setAnalysisError('Unable to get 2D rendering context for snapshot.');
      return;
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    // Generate real JPEG Blob and convert to base64 Data URL for API
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setAnalysisError('Failed to capture photograph from camera stream.');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setCapturedImage(dataUrl);
          stopCamera();
          analyzeWasteWithAI(dataUrl);
        };
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      0.85
    );
  };

  // Upload fallback for manual file selection with automatic client-side scaling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setCapturedImage(optimizedDataUrl);
            stopCamera();
            analyzeWasteWithAI(optimizedDataUrl);
          } else {
            setCapturedImage(result);
            stopCamera();
            analyzeWasteWithAI(result);
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Real AI Computer Vision Analysis via server /api/scan/classify
  const analyzeWasteWithAI = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiResult(null);

    try {
      const res = await fetch('/api/scan/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          mimeType: 'image/jpeg',
          collectorId,
          location,
        }),
      });

      // Safely read response text without assuming JSON
      const rawText = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn('Response from /api/scan/classify is not valid JSON:', rawText);
      }

      if (!data) {
        const cleanSnippet = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
        let errorMsg = `Server returned an invalid non-JSON response (HTTP ${res.status}).`;
        if (res.status === 404) {
          errorMsg = `API endpoint /api/scan/classify not found (HTTP 404). If deployed on Vercel, ensure GEMINI_API_KEY is configured in Vercel Project Settings > Environment Variables and redeploy.`;
        } else if (res.status === 503) {
          errorMsg = `Gemini Vision service temporarily unavailable (HTTP 503). Please verify GEMINI_API_KEY environment variable.`;
        } else if (cleanSnippet) {
          errorMsg = `Server response error (${res.status}): ${cleanSnippet}`;
        }
        setAnalysisError(errorMsg);
        setIsAnalyzing(false);
        return;
      }

      if (!res.ok || !data.success) {
        const errorMsg =
          data.error === 'GEMINI_API_KEY_MISSING'
            ? 'Gemini API Key Missing: Set GEMINI_API_KEY in Vercel Environment Variables or .env to run real computer vision inference.'
            : data.message || 'Vision classification failed. Please retake photo.';
        setAnalysisError(errorMsg);
        setIsAnalyzing(false);
        return;
      }

      const result: AIClassificationResult = data.result;
      setAiResult(result);
      setConfirmedCategory(result.category);
      setWeightKg(result.estimatedWeightKg || 0.2);
    } catch (err: any) {
      console.error('Network error during waste classification:', err);
      setAnalysisError(
        'Network error connecting to waste analysis backend: ' +
          (err?.message || 'Server unreachable')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and Save Scan Record
  const handleSaveScan = async () => {
    if (!capturedImage) return;

    setIsSaving(true);
    try {
      const pickup = activePickups.find((p) => p.id === associatedPickupId);

      await saveWasteScanRecord({
        collector_id: collectorId,
        pickup_id: associatedPickupId || undefined,
        resident_id: pickup?.resident_id,
        image_url: capturedImage,
        detected_category: aiResult?.category || confirmedCategory,
        confirmed_category: confirmedCategory,
        specific_label: aiResult?.specificLabel || confirmedCategory,
        confidence_score: aiResult?.confidence || 0.9,
        is_uncertain: aiResult?.isUncertain || confirmedCategory === 'Unknown or uncertain',
        quantity_count: quantity,
        estimated_weight_kg: weightKg,
        disposal_recommendation: aiResult?.recommendedDisposal || 'Disposed according to municipal rules.',
        recycling_guidelines: aiResult?.recyclingGuidelines || 'Swachh Bharat Segregation Norms',
        hazard_warning: aiResult?.hazardWarning || 'None',
        scan_latitude: location?.latitude,
        scan_longitude: location?.longitude,
        scan_address:
          location?.addressText ||
          (pickup?.address ? `${pickup.address.house_id}, ${pickup.address.area_locality}` : 'Field Scan Location'),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        resetScanner();
        if (onScanSaved) onScanSaved();
      }, 1800);
    } catch (err: any) {
      console.error('Error saving scan:', err);
      setAnalysisError('Failed to record waste scan to Supabase database.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setAiResult(null);
    setAnalysisError(null);
    setSaveSuccess(false);
    stopCamera();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Scanner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <Camera className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
              AI Waste Camera Scanner
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Live Video
              </span>
            </h3>
            <p className="text-xs text-emerald-100">
              Live photograph capture with real-time Swachh Bharat waste classification
            </p>
          </div>
        </div>

        {/* GPS Location Status */}
        <div className="flex items-center gap-2 text-xs bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
          <MapPin className={`w-3.5 h-3.5 ${location ? 'text-emerald-400' : 'text-amber-400'}`} />
          {locating ? (
            <span className="text-emerald-200 animate-pulse">Acquiring GPS...</span>
          ) : location ? (
            <span className="text-emerald-200 font-mono text-[11px]">
              {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
            </span>
          ) : (
            <button
              onClick={requestLocation}
              className="text-amber-300 hover:underline flex items-center gap-1"
            >
              Enable GPS
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Viewport: Stream / Captured / Placeholder */}
        {!capturedImage ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-[460px] flex items-center justify-center border-2 border-emerald-300 shadow-inner">
            {/* The video element is ALWAYS mounted to prevent null ref bugs */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {streamActive ? (
              <>
                {/* Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-emerald-400/70 rounded-2xl relative shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
                      <span className="bg-black/60 text-emerald-300 text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md">
                        Center waste item here
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live stream badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE CAMERA</span>
                </div>

                {/* Bottom Controls Bar: Flip Camera, Capture Photo, Stop Camera */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10">
                  <button
                    onClick={toggleCameraFacing}
                    type="button"
                    className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                    title="Flip between front and rear camera"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={capturePhoto}
                    type="button"
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-full shadow-lg shadow-emerald-900/40 flex items-center gap-2 transform active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    Capture & Scan Waste
                  </button>

                  <button
                    onClick={stopCamera}
                    type="button"
                    className="p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
                    title="Stop Camera Stream"
                  >
                    <CameraOff className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6 max-w-md z-10">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-900/40 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg">
                  <Video className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Live Camera Preview</h4>
                <p className="text-sm text-slate-300 mb-5">
                  Click below to activate your device camera and scan physical waste items using Google Gemini computer vision.
                </p>

                {cameraError && (
                  <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-xs text-left flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block font-semibold text-rose-300">Camera Notice:</strong>
                      <span>{cameraError}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => startCamera()}
                    disabled={isStartingCamera}
                    type="button"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition-all text-sm shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95"
                  >
                    {isStartingCamera ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Accessing Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Start Camera Preview
                      </>
                    )}
                  </button>

                  <label className="px-5 py-3 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-sm border border-white/10">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Upload Photo File
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Captured Image & AI Inspection Card */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Photo Preview Column */}
              <div className="md:col-span-5 space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100">
                  <img
                    src={capturedImage}
                    alt="Captured waste item"
                    className="w-full h-full object-cover"
                  />

                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                      <div className="relative mb-3">
                        <Sparkles className="w-10 h-10 text-emerald-400 animate-spin" />
                      </div>
                      <p className="font-medium text-sm text-emerald-300">
                        Analyzing visual features...
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Gemini 3.8 Flash Vision examining composition, recyclability &amp; contaminants
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Photo captured: {new Date().toLocaleTimeString()}</span>
                  <button
                    onClick={resetScanner}
                    className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retake Photo
                  </button>
                </div>
              </div>

              {/* AI Prediction & Verification Column */}
              <div className="md:col-span-7 space-y-4">
                {analysisError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Analysis Error
                    </div>
                    <p>{analysisError}</p>
                    <p className="text-[11px] text-rose-600 pt-1">
                      You can manually specify the category below to save this record.
                    </p>
                  </div>
                )}

                {aiResult && (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-xl border border-emerald-200/60 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">
                          AI Detected Waste
                        </span>
                        <h4 className="text-lg font-bold text-slate-900">
                          {aiResult.specificLabel}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {(aiResult.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Detection alerts: Human, No Garbage, or Low Confidence */}
                    {aiResult.specificLabel === 'Human detected' ? (
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Human Detected:</strong>
                          <span>A person was recognized in the photograph. Please point your camera directly at discarded waste or recycling containers.</span>
                        </div>
                      </div>
                    ) : aiResult.specificLabel === 'No garbage detected' ? (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">No Garbage Detected:</strong>
                          <span>No waste, trash, or recyclable items were found in this scene. Please ensure waste material is clearly visible in the camera frame.</span>
                        </div>
                      </div>
                    ) : aiResult.isUncertain ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Low confidence prediction. Please verify the category before confirming.
                        </span>
                      </div>
                    ) : null}

                    {/* Bin Recommendation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Recommended Disposal
                        </span>
                        <span className="font-medium text-slate-800">
                          {aiResult.recommendedDisposal}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Swachh Bharat Bin
                        </span>
                        <span className="font-semibold text-emerald-800">
                          {aiResult.recyclingGuidelines}
                        </span>
                      </div>
                    </div>

                    {aiResult.hazardWarning && aiResult.hazardWarning !== 'None' && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                        <span><strong>Hazard:</strong> {aiResult.hazardWarning}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Collector Confirmation Form */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm or Correct Waste Category:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {WASTE_CATEGORIES.map((cat) => {
                        const style = CATEGORY_COLORS[cat];
                        const isSelected = confirmedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setConfirmedCategory(cat)}
                            className={`p-2 text-left rounded-xl border text-xs font-medium transition-all ${
                              isSelected
                                ? `${style.bg} ${style.text} ${style.border} ring-2 ring-emerald-500 shadow-sm font-semibold`
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block truncate">{cat}</span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {style.binName.split(' ')[0]} {style.binName.split(' ')[1]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity & Weight Estimation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Count / Item Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-500" />
                        Estimated Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        max="100"
                        value={weightKg}
                        onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.1)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Link with active pickup */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link with Household Pickup (Optional):
                    </label>
                    <select
                      value={associatedPickupId}
                      onChange={(e) => setAssociatedPickupId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="">General Field Scan (Unassigned)</option>
                      {activePickups.map((pick) => (
                        <option key={pick.id} value={pick.id}>
                          {pick.address?.house_id || 'House'} — {pick.address?.area_locality || 'Scheduled Pickup'} ({pick.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Scan Action */}
                  <div className="pt-2">
                    {saveSuccess ? (
                      <div className="p-3 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 font-medium text-sm animate-pulse">
                        <CheckCircle2 className="w-5 h-5" />
                        Waste Scan Saved to Supabase Database!
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSaveScan}
                          disabled={isSaving || isAnalyzing}
                          type="button"
                          className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Saving Record to Database...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Confirm & Save Scan
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetScanner}
                          type="button"
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
