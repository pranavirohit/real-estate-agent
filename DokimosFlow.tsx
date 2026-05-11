"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Shield, Activity, Settings, Signal, Wifi, Battery, ArrowLeft, Upload, Check, ExternalLink, Copy } from "lucide-react";

export default function DokimosFlow() {
  const [currentScreen, setCurrentScreen] = useState(0);

  // Auto-advance through intro animation
  const advanceScreen = () => {
    if (currentScreen < 8) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const goBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  // Auto-advance animation screens
  useEffect(() => {
    if (currentScreen === 0 || currentScreen === 1) {
      const timer = setTimeout(() => {
        advanceScreen();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 0:
        return <Screen01A key="01a" />;
      case 1:
        return <Screen01B key="01b" />;
      case 2:
        return <Screen01C key="01c" onNext={advanceScreen} />;
      case 3:
        return <Screen02Upload key="02" onNext={advanceScreen} onBack={goBack} />;
      case 4:
        return <Screen02BLiveness key="02b" onNext={advanceScreen} onBack={goBack} />;
      case 5:
        return <Screen03Vault key="03" onNext={advanceScreen} onBack={goBack} />;
      case 6:
        return <Screen04Share key="04" onNext={advanceScreen} onBack={goBack} />;
      case 7:
        return <Screen05Receipt key="05" onNext={advanceScreen} onBack={goBack} />;
      case 8:
        return <Screen06History key="06" onBack={goBack} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile view - full screen on actual devices */}
      <div className="md:hidden relative w-full h-screen bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </div>

      {/* Desktop view - mockup with controls */}
      <div className="hidden md:flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="relative w-[390px] h-[844px] bg-white rounded-[40px] shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        </div>

        {/* Navigation controls for testing */}
        <div className="ml-8 flex flex-col gap-2">
          <button
            onClick={goBack}
            disabled={currentScreen === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={advanceScreen}
            disabled={currentScreen === 8}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          >
            Next →
          </button>
          <div className="text-sm text-gray-600 mt-4">
            Screen {currentScreen + 1} of 9
          </div>
        </div>
      </div>
    </>
  );
}

// Shared components
const StatusBar = () => (
  <div className="flex items-center justify-between px-6 h-[62px]">
    <span className="text-[15px] font-semibold text-gray-900">9:41</span>
    <div className="flex items-center gap-1">
      <Signal size={16} className="text-gray-900" />
      <Wifi size={16} className="text-gray-900" />
      <Battery size={20} className="text-gray-900" />
    </div>
  </div>
);

const ScrollingPills = ({ dark = false }: { dark?: boolean }) => {
  const pills = [
    "new bank account",
    "apartment rental",
    "freelance platform",
    "car rental",
    "background check",
    "gig company",
  ];

  return (
    <div className="overflow-hidden w-full px-6">
      <motion.div
        className="flex gap-2"
        initial={{ x: 0 }}
        animate={{ x: -200 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        {[...pills, ...pills, ...pills].map((pill, idx) => (
          <div
            key={idx}
            className={`px-4 h-8 rounded-full flex items-center justify-center whitespace-nowrap text-[13px] font-medium flex-shrink-0 ${
              dark
                ? "bg-white/10 border border-white/20 text-white/90"
                : "bg-gray-100 border border-gray-200 text-gray-600"
            }`}
          >
            {pill}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Screen 01A - Problem State
function Screen01A() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 bg-[#0F1B4C]"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[300px] left-6 right-6 text-[64px] font-bold text-white text-center leading-[1.1]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        Again?
      </motion.h1>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills dark />
      </div>
    </motion.div>
  );
}

// Screen 01B - Transition State
function Screen01B() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 bg-white"
    >
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[300px] left-6 right-6 text-[64px] font-bold text-gray-900 text-center leading-[1.1]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        Meet Dokimos.
      </motion.h1>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills />
      </div>
    </motion.div>
  );
}

// Screen 01C - Final CTA
function Screen01C({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white"
    >
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.8 }}
        className="absolute top-[260px] left-6 right-6 text-[40px] font-bold text-gray-900 text-center leading-[1.15]"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        The last time you'll ever<br />need to upload your ID.
      </motion.h2>

      <div className="absolute top-[415.5px] left-0 w-full">
        <ScrollingPills />
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-0 left-0 right-0 bg-[#0F1B4C] rounded-t-[24px] px-6 py-10 flex flex-col gap-6"
      >
        <h3 className="text-[22px] font-bold text-white text-center">
          Get started with Dokimos
        </h3>
        <button
          onClick={onNext}
          className="w-full h-14 bg-[#4F46E5] rounded-xl text-white text-[16px] font-bold hover:bg-[#4338CA] transition-colors"
        >
          Sign up
        </button>
        <button className="w-full h-14 bg-white/10 border border-white/20 rounded-xl text-white text-[16px] font-bold hover:bg-white/20 transition-colors">
          Log in
        </button>
      </motion.div>
    </motion.div>
  );
}

// Screen 02 - Upload Flow
function Screen02Upload({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [uploadState, setUploadState] = useState<"default" | "drag" | "selected" | "scanning">("default");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = () => {
    setUploadState("selected");
  };

  const handleVerify = () => {
    setUploadState("scanning");
    setTimeout(() => {
      onNext();
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-[#FAFAF9] flex flex-col"
    >
      <StatusBar />
      
      {/* Top Navigation */}
      <div className="px-6 h-[52px] flex items-center">
        <button onClick={onBack}>
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
      </div>

      {/* Headline Section */}
      <div className="px-6 mt-8">
        <h1 className="text-[36px] font-bold text-gray-900 leading-[1.15]" style={{ fontFamily: "Instrument Serif, serif" }}>
          One last upload. Ever.
        </h1>
        <p className="text-[15px] text-gray-500 mt-3 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Take a photo or upload an image of any government ID.
        </p>
        <p className="text-[12px] text-gray-500 mt-2 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Your ID is processed in protected hardware and immediately deleted. Not even Dokimos can see it.
        </p>
      </div>

      {/* Upload Zone - fills remaining space */}
      <div className="flex-1 px-6 mt-6 mb-6">
        <button
          onClick={uploadState === "default" ? handleFileSelect : uploadState === "selected" ? () => setUploadState("default") : undefined}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          disabled={uploadState === "scanning"}
          className={`relative w-full h-full rounded-2xl border-[1.5px] transition-all ${
            uploadState === "scanning" ? "cursor-default" : "cursor-pointer hover:border-gray-300"
          } ${
            uploadState === "scanning"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : uploadState === "selected"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : isDragging
              ? "border-[#4F46E5] border-solid bg-[#EEF2FF]"
              : "border-dashed border-gray-200 bg-white"
          }`}
          style={{ minHeight: "320px" }}
        >
          {/* Default State */}
          {uploadState === "default" && !isDragging && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Document outline illustration */}
              <div className="relative w-[120px] h-[80px] rounded-lg border-[1.5px] border-gray-200 mb-5">
                <div className="absolute top-3 left-3 w-[60px] h-1 bg-gray-100 rounded" />
                <div className="absolute top-6 left-3 w-[40px] h-1 bg-gray-100 rounded" />
                <div className="absolute top-3 right-3 w-6 h-6 bg-gray-100 rounded" />
              </div>

              <p className="text-[16px] font-medium text-gray-900 mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Drop your ID here
              </p>
              <p className="text-[13px] text-gray-400 mb-5" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                or tap to browse your camera roll
              </p>

              <div className="flex items-center gap-2">
                {["JPG", "PNG", "PDF"].map((format) => (
                  <div key={format} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-full" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                    {format}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Drag State */}
          {isDragging && uploadState === "default" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative w-[120px] h-[80px] rounded-lg border-[1.5px] border-[#4F46E5] mb-5">
                <div className="absolute top-3 left-3 w-[60px] h-1 bg-[#4F46E5] rounded" />
                <div className="absolute top-6 left-3 w-[40px] h-1 bg-[#4F46E5] rounded" />
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#4F46E5] rounded" />
              </div>
              <p className="text-[16px] font-medium text-[#4F46E5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Release to upload
              </p>
            </div>
          )}

          {/* Selected State */}
          {uploadState === "selected" && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gray-200" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[12px] font-medium px-4 py-1.5 rounded-full flex items-center gap-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                <Check size={12} />
                ID uploaded
              </div>
              <button
                onClick={() => setUploadState("default")}
                className="absolute top-4 right-4 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-gray-700 text-sm">×</span>
              </button>
            </div>
          )}

          {/* Scanning State */}
          {uploadState === "scanning" && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gray-200" />
              <div className="absolute inset-0 bg-[#0F1B4C] bg-opacity-45 flex flex-col items-center justify-center">
                <p className="text-[15px] font-medium text-white mb-3" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                  Processing inside TEE...
                </p>
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent"
                  style={{ boxShadow: "0 0 8px #4F46E5" }}
                  animate={{ y: [0, 200, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="flex items-center gap-1.5 mt-4">
                  <motion.div
                    className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Fixed Footer Bar */}
      <div className="bg-white border-t border-gray-100 px-6 pt-5 pb-8">
        {uploadState === "scanning" ? (
          <p className="text-[12px] text-gray-500 text-center" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            This takes about 30 seconds
          </p>
        ) : (
          <button
            onClick={handleVerify}
            disabled={uploadState === "default"}
            className={`w-full h-14 rounded-xl text-[15px] font-medium transition-colors ${
              uploadState === "selected"
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Instrument Sans, sans-serif" }}
          >
            Verify Document
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Screen 02B - Liveness Check
function Screen02BLiveness({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [livenessState, setLivenessState] = useState<"ready" | "detecting" | "processing">("ready");
  const [faceDetected, setFaceDetected] = useState(false);

  const handleStartCapture = () => {
    setLivenessState("detecting");
    // Simulate face detection after 1.5s
    setTimeout(() => {
      setFaceDetected(true);
    }, 1500);
  };

  const handleVerifyFace = () => {
    setLivenessState("processing");
    setTimeout(() => {
      onNext();
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-[#FAFAF9] flex flex-col"
    >
      <StatusBar />
      
      {/* Top Navigation */}
      <div className="px-6 h-[52px] flex items-center">
        <button onClick={onBack}>
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
      </div>

      {/* Headline Section */}
      <div className="px-6 mt-8">
        <h1 className="text-[36px] font-bold text-gray-900 leading-[1.15]" style={{ fontFamily: "Instrument Serif, serif" }}>
          Making sure it's you.
        </h1>
        <p className="text-[15px] text-gray-500 mt-3 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Take a quick selfie to confirm you're the person on this ID.
        </p>
        <p className="text-[12px] text-gray-500 mt-2 leading-[1.5]" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          Your selfie is processed in protected hardware and immediately deleted. Not even Dokimos can see it.
        </p>
      </div>

      {/* Camera Preview Zone */}
      <div className="flex-1 px-6 mt-6 mb-6">
        <button
          onClick={livenessState === "ready" ? handleStartCapture : undefined}
          disabled={livenessState === "processing"}
          className={`relative w-full h-full rounded-2xl border-[1.5px] transition-all overflow-hidden ${
            livenessState === "processing"
              ? "border-emerald-600 bg-[#F0FDF4]"
              : faceDetected
              ? "border-emerald-600 bg-[#F0FDF4]"
              : livenessState === "detecting"
              ? "border-[#4F46E5] bg-gray-900"
              : "border-dashed border-gray-200 bg-gray-900 cursor-pointer hover:border-gray-300"
          }`}
          style={{ minHeight: "320px" }}
        >
          {/* Ready State - Tap to start camera */}
          {livenessState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-32 h-40 rounded-full border-[1.5px] border-gray-400 border-dashed mb-5" />
              <p className="text-[16px] font-medium text-white mb-2" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Tap to start camera
              </p>
              <p className="text-[13px] text-gray-400" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Position your face in the oval
              </p>
            </div>
          )}

          {/* Detecting State - Camera active, waiting for face */}
          {livenessState === "detecting" && !faceDetected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
              <div className="w-32 h-40 rounded-full border-2 border-[#4F46E5] mb-5 animate-pulse" />
              <p className="text-[15px] font-medium text-white" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Position your face in the oval
              </p>
            </div>
          )}

          {/* Face Detected State */}
          {faceDetected && livenessState === "detecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
              <div className="w-32 h-40 rounded-full border-2 border-emerald-600" />
              <div className="absolute w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check size={20} className="text-white" />
              </div>
              <p className="text-[15px] font-medium text-white mt-5" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Face detected
              </p>
            </div>
          )}

          {/* Processing State */}
          {livenessState === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1B4C] bg-opacity-90">
              <p className="text-[15px] font-medium text-white mb-3" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Matching face to ID...
              </p>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Fixed Footer Bar */}
      <div className="bg-white border-t border-gray-100 px-6 pt-5 pb-8">
        {livenessState === "processing" ? (
          <p className="text-[12px] text-gray-500 text-center" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            This takes about 10 seconds
          </p>
        ) : (
          <button
            onClick={handleVerifyFace}
            disabled={!faceDetected}
            className={`w-full h-14 rounded-xl text-[15px] font-medium transition-colors ${
              faceDetected
                ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Instrument Sans, sans-serif" }}
          >
            Verify Face Match
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Screen 03 - Vault Dashboard
function Screen03Vault({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white overflow-y-auto"
    >
      <StatusBar />
      
      <div className="px-6 h-14 flex items-center justify-between">
        <span className="text-[17px] font-bold text-[#0F1B4C]">Dokimos</span>
      </div>

      <div className="px-6 mt-4 pb-8">
        <div className="w-full bg-white border-l-4 border-emerald-600 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-emerald-600">Identity Verified</p>
            <p className="text-[12px] text-gray-500">4/1/2026 at 5:33 PM</p>
          </div>
          <div className="bg-[#0F1B4C] text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
            <Shield size={10} className="text-white" />
            <span>Processed in TEE</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900">Your verified details</h2>
          <span className="text-[14px] text-gray-500">4 attributes</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {[
            { label: "Full Name", value: "Jordan Lee" },
            { label: "Age Over 21", value: "Verified", color: "text-emerald-600" },
            { label: "Document Expiry", value: "Valid", color: "text-emerald-600" },
            { label: "Nationality", value: "United States" },
          ].map((attr, idx) => (
            <div key={idx} className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase text-gray-400 tracking-wider mb-1">{attr.label}</p>
                <p className={`text-[18px] font-bold ${attr.color || "text-gray-900"}`} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                  {attr.value}
                </p>
              </div>
              <button
                onClick={idx === 1 ? onNext : undefined}
                className="px-4 py-2 border border-[#4F46E5] text-[#4F46E5] text-[13px] font-medium rounded-full hover:bg-[#EEF2FF] transition-colors"
              >
                Share
              </button>
            </div>
          ))}
        </div>

        <p className="text-[13px] text-gray-500 text-center mt-6 px-4 leading-relaxed">
          Tap Share on any attribute to send a verified proof — without sharing your actual ID.
        </p>
      </div>
    </motion.div>
  );
}

// Screen 04 - Share Modal
function Screen04Share({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0"
    >
      {/* Blurred background */}
      <div className="absolute inset-0 bg-gray-400/50 backdrop-blur-sm" onClick={onBack} />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 844 }}
        animate={{ y: 422 }}
        exit={{ y: 844 }}
        transition={{ type: "spring", damping: 30 }}
        className="absolute bottom-0 left-0 right-0 h-[422px] bg-white rounded-t-[24px] px-6 pt-6 pb-10"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
            A
          </div>
          <div>
            <p className="text-[32px] font-bold text-gray-900" style={{ fontFamily: "Instrument Serif, serif" }}>
              Acme Brokerage
            </p>
            <p className="text-[14px] text-gray-600">is requesting verification</p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-200 my-4" />

        <p className="text-[14px] text-gray-500 uppercase tracking-wide mb-3">They're asking for:</p>

        <div className="space-y-0">
          {["Full Name", "Age Over 21", "Document Not Expired"].map((attr, idx) => (
            <div key={idx} className="py-4 border-b border-gray-100">
              <p className="text-[15px] font-medium text-gray-900">{attr}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-[#F0FDF4] rounded-lg p-3 flex items-start gap-2">
          <Shield size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-gray-700">
            They receive a cryptographic 'yes' — not your actual ID.
          </p>
        </div>

        <button
          onClick={onNext}
          className="w-full h-14 bg-[#4F46E5] rounded-xl text-white text-[14px] font-bold mt-4 flex items-center justify-center gap-2 hover:bg-[#4338CA] transition-colors"
        >
          <Shield size={14} className="text-white" />
          APPROVE & SHARE
        </button>

        <button className="w-full h-14 bg-white border border-gray-200 rounded-xl text-[#EF4444] text-[14px] font-bold mt-3 hover:bg-gray-50 transition-colors">
          Deny Request
        </button>

        <p className="text-[10px] text-gray-300 text-center mt-4">
          Powered by Dokimos · Cryptographically verified
        </p>
      </motion.div>
    </motion.div>
  );
}

// Screen 05 - Verification Receipt
function Screen05Receipt({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white overflow-y-auto"
    >
      <StatusBar />
      
      <div className="px-6 py-4">
        <h1 className="text-[17px] font-bold text-[#0F1B4C] text-center">Dokimos</h1>
      </div>

      <div className="flex flex-col items-center px-6 mt-12">
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mb-5">
          <Check size={40} className="text-white" />
        </div>

        <h2 className="text-[56px] font-bold text-emerald-600 mb-4" style={{ fontFamily: "Instrument Serif, serif" }}>
          Verified
        </h2>

        <div className="w-full h-px bg-gray-200 my-4" />

        <p className="text-[22px] font-medium text-gray-900 mb-2">Age Over 21</p>
        <p className="text-[13px] text-gray-500 mb-8">Verified on April 1, 2026</p>

        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-4"
        >
          <span className="text-[15px] font-medium text-gray-900">How is this verified?</span>
          <span className={`transform transition-transform ${accordionOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {accordionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="w-full mb-4 px-4 text-[14px] text-gray-600 leading-relaxed"
          >
            This attestation was generated by code running inside an Intel TDX Trusted Execution Environment. 
            The signature below was produced by a wallet that only that specific, auditable code can access. 
            You can verify this yourself using the buttons below.
          </motion.div>
        )}

        <button className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-3 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-200" />
            <span className="text-[14px] font-medium text-gray-900">Verify Signature on Etherscan</span>
          </div>
          <ExternalLink size={16} className="text-[#4F46E5]" />
        </button>

        <button
          onClick={onNext}
          className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#0F1B4C] rounded" />
            <span className="text-[14px] font-medium text-gray-900">View Code on EigenCloud Dashboard</span>
          </div>
          <ExternalLink size={16} className="text-[#4F46E5]" />
        </button>

        <div className="w-full bg-[#0F1B4C] rounded-xl p-4 relative">
          <button className="absolute top-4 right-4 text-[11px] text-gray-400 hover:text-gray-300">
            <Copy size={12} className="inline" /> Copy all
          </button>
          <pre className="text-[11px] font-mono overflow-x-auto">
            <span className="text-gray-400">message:</span> <span className="text-gray-200">Age Over 21</span>{"\n"}
            <span className="text-gray-400">messageHash:</span> <span className="text-gray-200">0x7f9...</span>{"\n"}
            <span className="text-gray-400">signature:</span> <span className="text-indigo-300">0x8a4c...</span>{"\n"}
            <span className="text-gray-400">signer:</span> <span className="text-indigo-300">0x2b5f...</span>
          </pre>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-6">
          Issued by Dokimos · Cryptographic identity infrastructure
        </p>
      </div>
    </motion.div>
  );
}

// Screen 06 - History
function Screen06History({ onBack }: { onBack: () => void }) {
  const history = [
    { company: "Coinbase", initial: "C", attrs: ["Age Over 21", "Document not expired"], time: "Today" },
    { company: "Acme Brokerage", initial: "A", attrs: ["Full Name", "Age Over 21", "Document not expired"], time: "2 days ago" },
    { company: "Turo", initial: "T", attrs: ["Full Name", "Document not expired"], time: "Apr 1" },
    { company: "Upwork", initial: "U", attrs: ["Full Name", "Nationality"], time: "Mar 28" },
  ];

  const historyOld = [
    { company: "Chase Bank", initial: "C", attrs: ["Full Name", "Date of Birth", "Document not expired"], time: "Mar 15" },
    { company: "Apartment App", initial: "A", attrs: ["Full Name", "Nationality", "Document not expired"], time: "Mar 3" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white"
    >
      <StatusBar />
      
      <div className="px-6 h-[52px] flex items-center">
        <span className="text-[17px] font-bold text-[#0F1B4C]">Dokimos</span>
      </div>

      <div className="px-6 mt-8">
        <h1 className="text-[32px] font-bold text-gray-900 mb-2" style={{ fontFamily: "Instrument Serif, serif" }}>
          Where you've verified.
        </h1>
        <p className="text-[14px] text-gray-500 mb-6">Every place you've shared a verified proof.</p>

        <div className="flex gap-2 mb-6">
          {["All", "This month", "Last 3 months", "Older"].map((filter, idx) => (
            <button
              key={idx}
              className={`px-4 h-8 rounded-full text-[13px] font-medium transition-colors ${
                idx === 0
                  ? "bg-[#0F1B4C] text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {history.map((item, idx) => (
            <div key={idx} className="bg-white border-b border-gray-100 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                  {item.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900 mb-2">{item.company}</p>
                  <div className="space-y-1.5">
                    {item.attrs.map((attr, aidx) => (
                      <div key={aidx} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[13px] text-gray-600">{attr}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[12px] text-gray-400 flex-shrink-0">{item.time}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-8 mb-4 px-6">LAST MONTH</p>

        <div className="space-y-4">
          {historyOld.map((item, idx) => (
            <div key={idx} className="bg-white border-b border-gray-100 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
                  {item.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-gray-900 mb-2">{item.company}</p>
                  <div className="space-y-1.5">
                    {item.attrs.map((attr, aidx) => (
                      <div key={aidx} className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-[13px] text-gray-600">{attr}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[12px] text-gray-400 flex-shrink-0">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around">
        <button className="flex flex-col items-center gap-1">
          <Shield size={20} className="text-gray-500" />
          <span className="text-[11px] text-gray-500">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#4F46E5] mb-1" />
          <Activity size={20} className="text-[#4F46E5]" />
          <span className="text-[11px] text-[#4F46E5]">Activity</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Settings size={20} className="text-gray-500" />
          <span className="text-[11px] text-gray-500">Settings</span>
        </button>
      </div>
    </motion.div>
  );
}
