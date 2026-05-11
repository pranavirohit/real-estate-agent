"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Shield, Lock, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

type DocumentType = "drivers_license" | "passport";

export default function VaultHome() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("drivers_license");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10MB");
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleVerify = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(selectedFile);
      const imageBase64 = await base64Promise;

      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Call backend API route (not TEE directly)
      const response = await axios.post("/api/verify", {
        imageBase64,
        requestedAttributes: [],
      });

      localStorage.setItem("dokimos_attestation", JSON.stringify(response.data));
      router.push("/vault");
    } catch (err) {
      console.error("Verification failed");
      setError("Verification failed. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary mb-2">Dokimos</h1>
          <p className="text-muted-foreground">Verify once. Trusted everywhere.</p>
        </header>

        <div className="space-y-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative"
          >
            <label
              className={`
                relative block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${previewUrl ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"}
              `}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={isScanning}
              />

              {previewUrl ? (
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div
                        className="absolute inset-0 bg-black/20 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scan-glow"
                          initial={{ top: "0%" }}
                          animate={{ top: "100%" }}
                          transition={{
                            duration: 2.5,
                            ease: "easeInOut",
                            repeat: Infinity,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your ID document here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                </div>
              )}
            </label>

            {isScanning && (
              <div className="absolute -bottom-8 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-primary font-medium">
                  <Lock className="w-4 h-4" />
                  Processing inside TEE...
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <p className="text-sm font-medium text-foreground mb-3">Document Type</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDocumentType("drivers_license")}
                disabled={isScanning}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all
                  ${documentType === "drivers_license" 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <FileImage className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Driver's License</p>
              </button>
              <button
                onClick={() => setDocumentType("passport")}
                disabled={isScanning}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all
                  ${documentType === "passport" 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <FileImage className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Passport</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={!selectedFile || isScanning}
            className="w-full h-12 text-base font-medium"
          >
            {isScanning ? "Verifying..." : "Verify Document"}
          </Button>

          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  Hardware-Level Privacy
                </p>
                <p className="text-sm text-muted-foreground">
                  Your document is processed inside an Intel TDX Trusted Execution
                  Environment. Not even we can see it. The verification runs in
                  sealed hardware that produces a cryptographic proof.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
