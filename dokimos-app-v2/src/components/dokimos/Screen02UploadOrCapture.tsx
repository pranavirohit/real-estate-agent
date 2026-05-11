"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Camera, ImagePlus, Check, XCircle } from "lucide-react";
import { PlaidSplitOnboardingLayout } from "@/components/dokimos/onboarding/PlaidSplitOnboardingLayout";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIME_ALLOWLIST = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

function extFromName(name: string): string {
  if (!name.includes(".")) return "";
  return name.split(".").pop()!.toLowerCase();
}

/** JPG/PNG/WebP by MIME or by extension when the browser reports an empty/incorrect type. */
function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  // eslint-disable-next-line no-console -- intentional diagnostic logging
  console.log("[Dokimos ID upload] validate", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, message: "File too large. Maximum size is 10MB." };
  }

  const rawType = (file.type ?? "").trim().toLowerCase();
  const ext = extFromName(file.name);
  const extOk = ["jpg", "jpeg", "png", "webp"].includes(ext);

  // MIME quirks: pjpeg (IE/Windows), x-png; still restrict to ID-friendly formats (not gif/heic).
  if (MIME_ALLOWLIST.includes(rawType as (typeof MIME_ALLOWLIST)[number])) {
    return { ok: true };
  }
  if (rawType === "image/pjpeg" || rawType === "image/x-png") {
    return { ok: true };
  }
  if (rawType.startsWith("image/") && extOk) {
    return { ok: true };
  }

  if (!rawType || rawType === "application/octet-stream") {
    if (extOk) {
      return { ok: true };
    }
  }

  if (extOk) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "Please use a JPG, PNG, or WebP image.",
  };
}

type Mode = "upload" | "camera";

type Screen02UploadOrCaptureProps = {
  onNext: () => void;
  onBack: () => void;
  setStoredImageData: (data: string) => void;
};

/**
 * Step 0: government ID via file upload or live camera capture (toggle).
 * Advances to step 1 (liveness) with the same base64 handoff as before.
 */
export function Screen02UploadOrCapture({
  onNext,
  onBack,
  setStoredImageData,
}: Screen02UploadOrCaptureProps) {
  const [mode, setMode] = useState<Mode>("upload");
  const [uploadState, setUploadState] = useState<"default" | "selected">("default");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraSessionRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "preview" | "error">("idle");

  const releaseCamera = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.srcObject = null;
      try {
        v.load();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (mode !== "camera") {
      releaseCamera();
      setCameraStatus("idle");
      return;
    }

    let cancelled = false;
    const sessionAtMount = cameraSessionRef.current;
    setCameraStatus("starting");

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("error");
        setError("Camera is not available in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled || sessionAtMount !== cameraSessionRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setCameraStatus("preview");
        setError(null);
      } catch {
        if (!cancelled) {
          setCameraStatus("error");
          setError("Could not access the camera. Check permissions and try again.");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      cameraSessionRef.current += 1;
      releaseCamera();
    };
  }, [mode, releaseCamera]);

  const handleFileInput = (file: File) => {
    const v = validateImageFile(file);
    if (!v.ok) {
      setError(v.message);
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadState("selected");
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // eslint-disable-next-line no-console -- diagnostic
      console.log("[Dokimos ID upload] onChange: no files (user may have cancelled)");
      return;
    }
    const file = files[0];
    if (file) handleFileInput(file);
    e.target.value = "";
  };

  const handleContinue = async () => {
    if (!selectedFile) return;
    setError(null);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = reader.result;
          if (typeof r !== "string") {
            reject(new Error("Invalid read result"));
            return;
          }
          const parts = r.split(",");
          const b64 = parts.length > 1 ? parts[1] : "";
          if (!b64) {
            reject(new Error("Invalid image data"));
            return;
          }
          resolve(b64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(selectedFile);
      });

      setStoredImageData(imageBase64);
      onNext();
    } catch {
      setError("Could not read image. Please try again.");
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileInput(file);
  };

  const captureIdPhoto = () => {
    const video = videoRef.current;
    if (!video || cameraStatus !== "preview") return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture image. Try again.");
          return;
        }
        const file = new File([blob], `id-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setMode("upload");
        handleFileInput(file);
      },
      "image/jpeg",
      0.92
    );
  };

  const clearSelection = () => {
    setUploadState("default");
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const cardTitle =
    mode === "upload" ? "Upload your government ID" : "Take a photo of your ID";
  const cardDescription =
    mode === "upload"
      ? "Take a photo or upload an image of any government ID with a photo of you. Not even Dokimos can see your ID after processing."
      : "Position your ID in the frame, then capture. Use good lighting and avoid glare.";
  const cardDetail =
    mode === "upload"
      ? undefined
      : "Not even Dokimos can see your ID after processing.";

  const nextDisabled = uploadState !== "selected";

  return (
    <PlaidSplitOnboardingLayout
      onBack={onBack}
      leftHeadline="One last upload. Ever."
      leftBullets={[
        "Get verified in minutes with a single photo",
        "Your ID is processed in protected hardware and deleted immediately",
        "Approve what you share—per request—with cryptographic proof",
      ]}
      cardTitle={cardTitle}
      cardDescription={cardDescription}
      cardDetail={cardDetail}
      error={
        error ? (
          <p className="text-left font-sans text-[13px] text-red-600">{error}</p>
        ) : undefined
      }
      footer={
        <button
          type="button"
          onClick={handleContinue}
          disabled={nextDisabled}
          className={`ml-auto inline-flex h-11 min-h-[44px] min-w-[7rem] shrink-0 items-center justify-center rounded-lg px-6 text-[14px] font-semibold transition-colors ${
            !nextDisabled
              ? "bg-[#2DD4BF] text-[#0f172a] hover:bg-[#26d9c4]"
              : "cursor-not-allowed bg-slate-300 text-slate-500"
          }`}
        >
          Next
        </button>
      }
    >
      {mode === "upload" && (
        <>
          <input
            id="dokimos-id-upload-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={onFileInputChange}
          />

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full min-h-[280px] overflow-hidden rounded-xl border transition-colors sm:min-h-[320px] ${
              uploadState === "selected"
                ? "border-emerald-400 bg-emerald-50/50"
                : isDragging
                  ? "border-2 border-solid border-[#2DD4BF] bg-teal-50/80"
                  : "border border-slate-200 bg-slate-50/80"
            }`}
          >
            {uploadState === "default" && (
              <>
                <div
                  className={`relative flex min-h-[280px] flex-col items-center justify-center px-4 py-8 sm:min-h-[320px] ${isDragging ? "pointer-events-none" : ""}`}
                >
                  <div className="relative mb-5 h-[72px] w-[112px] rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="absolute left-2.5 top-2.5 h-1 w-14 rounded bg-slate-100" />
                    <div className="absolute left-2.5 top-5 h-1 w-10 rounded bg-slate-100" />
                    <div className="absolute right-2 top-2 h-7 w-7 rounded bg-slate-100" />
                  </div>

                  <p className="mb-1 text-center text-[15px] font-medium text-slate-900">
                    Upload or capture
                  </p>
                  <p className="mb-5 max-w-[300px] text-center text-[13px] leading-relaxed text-slate-500">
                    Your device may ask for camera or photo library access only when you choose a file.
                  </p>

                  <label
                    htmlFor="dokimos-id-upload-input"
                    className="flex h-11 min-h-[44px] w-full max-w-[320px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    <ImagePlus size={18} className="shrink-0 text-[#2DD4BF]" strokeWidth={2} aria-hidden />
                    Choose file
                  </label>

                  <button
                    type="button"
                    onClick={() => setMode("camera")}
                    className="mt-3 flex h-11 min-h-[44px] w-full max-w-[320px] shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Camera size={18} className="shrink-0 text-[#2DD4BF]" strokeWidth={2} aria-hidden />
                    Take a photo
                  </button>

                  <p className="mt-4 hidden text-center text-[12px] text-slate-400 sm:block">
                    Or drag and drop an image here
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {["JPG", "PNG", "WebP"].map((format) => (
                      <span
                        key={format}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/90"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                {isDragging && (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-teal-50/70"
                    aria-hidden
                  >
                    <p className="text-[15px] font-semibold text-[#0f766e]">Drop to upload</p>
                  </div>
                )}
              </>
            )}

            {uploadState === "selected" && previewUrl && (
              <div className="relative min-h-[280px] sm:min-h-[320px]">
                <img
                  src={previewUrl}
                  alt="ID preview"
                  className="h-full min-h-[280px] w-full object-cover sm:min-h-[320px]"
                />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white">
                  <Check size={12} strokeWidth={3} />
                  Successfully Uploaded
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                  aria-label="Remove image"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {mode === "camera" && (
        <div className="space-y-4">
          <div
            className={`relative w-full min-h-[280px] overflow-hidden rounded-xl border sm:min-h-[320px] ${
              cameraStatus === "preview"
                ? "border-[#2DD4BF] bg-black"
                : cameraStatus === "error"
                  ? "border-red-200 bg-slate-900"
                  : "border border-slate-200 bg-slate-900"
            }`}
          >
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover ${
                cameraStatus === "preview" ? "opacity-100" : "opacity-0"
              }`}
              autoPlay
              playsInline
              muted
            />

            {cameraStatus === "starting" && (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-white sm:min-h-[320px]">
                <p className="text-[15px] font-medium">Starting camera…</p>
              </div>
            )}

            {cameraStatus === "error" && (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-4 sm:min-h-[320px]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle size={32} className="text-red-600" />
                </div>
                <p className="text-center text-[15px] font-medium text-white/90">Camera unavailable</p>
              </div>
            )}

            {cameraStatus === "preview" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                <div className="rounded-lg border-2 border-dashed border-white/50" style={{ width: "85%", height: "75%" }} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={captureIdPhoto}
            disabled={cameraStatus !== "preview"}
            className={`flex h-11 w-full max-w-[320px] mx-auto items-center justify-center rounded-lg px-4 text-[14px] font-semibold transition-colors ${
              cameraStatus === "preview"
                ? "bg-[#2DD4BF] text-[#0f172a] hover:bg-[#26d9c4]"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            Capture photo
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("upload");
            }}
            className="flex h-11 w-full max-w-[320px] mx-auto shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <ImagePlus size={18} className="shrink-0 text-[#2DD4BF]" strokeWidth={2} aria-hidden />
            Upload a file instead
          </button>
        </div>
      )}
    </PlaidSplitOnboardingLayout>
  );
}
