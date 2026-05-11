"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Lock,
  Share2,
  ExternalLink,
  User,
  Calendar,
  Shield,
  Flag,
  FileText,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  AttestationData,
  encodeAttestation,
  truncateAddress,
  truncateSignature,
} from "@/lib/utils";

const ATTRIBUTE_CONFIG: Record<
  string,
  { label: string; icon: typeof User; isBoolean: boolean }
> = {
  name: { label: "Full Name", icon: User, isBoolean: false },
  dateOfBirth: { label: "Date of Birth", icon: Calendar, isBoolean: false },
  ageOver21: { label: "Age Over 21", icon: Shield, isBoolean: true },
  notExpired: { label: "Document Not Expired", icon: CheckCircle, isBoolean: true },
  nationality: { label: "Nationality", icon: Flag, isBoolean: false },
  documentType: { label: "Document Type", icon: FileText, isBoolean: false },
};

function VaultDashboardContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [attestation, setAttestation] = useState<AttestationData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dokimos_attestation");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setAttestation(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  const handleShare = async (attributeKey: string, value: string | boolean) => {
    if (!attestation) return;

    const shareData = {
      attribute: attributeKey,
      value,
      timestamp: attestation.timestamp,
      signature: attestation.signature,
      signer: attestation.signer,
      message: attestation.message,
      messageHash: attestation.messageHash,
    };

    const encoded = encodeAttestation(shareData);
    const shareUrl = `${window.location.origin}/verify/${encoded}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied!");
    } catch {
      showToast("Failed to copy link");
    }
  };

  if (!attestation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const verifyTimestamp = new Date(attestation.timestamp).toLocaleString();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Dokimos</h1>
          <p className="text-muted-foreground">Your Identity Vault</p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">
                  Identity Verified
                </h2>
                <p className="text-sm text-green-600">{verifyTimestamp}</p>
              </div>
            </div>
            <Tooltip content="Processed inside Intel TDX Trusted Execution Environment - sealed hardware that not even the operator can access">
              <Badge variant="secondary" className="cursor-help flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Processed in TEE
              </Badge>
            </Tooltip>
          </div>
        </motion.div>

        <section className="mb-10">
          <h3 className="text-lg font-semibold mb-4">Verified Attributes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(attestation.attributes).map(([key, value], index) => {
              const config = ATTRIBUTE_CONFIG[key];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {config.label}
                            </p>
                            {config.isBoolean ? (
                              <div className="flex items-center gap-1.5 mt-1">
                                {value ? (
                                  <>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-green-700">
                                      Verified
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-medium text-red-600">
                                    Not Verified
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="font-semibold text-foreground mt-0.5">
                                {String(value)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(key, value)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Share2 className="w-4 h-4 mr-1.5" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <Separator className="my-8" />

        <section>
          <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Signer Address</span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {truncateAddress(attestation.signer)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Signature</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {truncateSignature(attestation.signature)}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(attestation.signature);
                      showToast("Signature copied!");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open("https://etherscan.io/verifySig", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Verify on Etherscan
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    window.open("https://verifiability.eigencloud.xyz", "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on EigenCloud Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default function VaultDashboard() {
  return (
    <ToastProvider>
      <VaultDashboardContent />
    </ToastProvider>
  );
}
