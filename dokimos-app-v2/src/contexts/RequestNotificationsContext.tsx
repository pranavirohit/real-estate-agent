"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import type { VerificationRequest } from "@/types/dokimos";
import { RequestNotificationModal } from "@/components/RequestNotificationModal";

type RequestNotificationsContextValue = {
  pendingCount: number;
  openRequestModal: (req: VerificationRequest) => void;
};

const RequestNotificationsContext = createContext<RequestNotificationsContextValue | null>(
  null
);

export function useRequestNotificationsContext() {
  const ctx = useContext(RequestNotificationsContext);
  if (!ctx) {
    throw new Error(
      "useRequestNotificationsContext must be used within RequestNotificationsProvider"
    );
  }
  return ctx;
}

/** Optional: use where provider may be absent (e.g. tests). */
export function usePendingRequestCount(): number {
  const ctx = useContext(RequestNotificationsContext);
  return ctx?.pendingCount ?? 0;
}

export function RequestNotificationsProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const { setSelectedRequest } = useDokimosApp();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [modalRequest, setModalRequest] = useState<VerificationRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const dismissedModalIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const resolveEmail = useCallback((): string | null => {
    if (sessionStatus === "authenticated" && session?.user?.email) {
      return session.user.email;
    }
    try {
      const raw = localStorage.getItem("dokimos_user");
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string };
        return parsed.email ?? null;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, [sessionStatus, session?.user?.email]);

  const fetchRequests = useCallback(async () => {
    const email = resolveEmail();
    if (!email) {
      setRequests([]);
      return;
    }
    try {
      const response = await axios.get(
        `/api/requests/user/${encodeURIComponent(email)}`,
        { timeout: 15000 }
      );
      const raw = response.data;
      const list: VerificationRequest[] = Array.isArray(raw)
        ? raw
        : raw &&
            typeof raw === "object" &&
            Array.isArray((raw as { requests?: unknown }).requests)
          ? (raw as { requests: VerificationRequest[] }).requests
          : [];
      setRequests(list);
    } catch {
      setRequests([]);
    }
  }, [resolveEmail]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    void fetchRequests();
    const t = setInterval(fetchRequests, 10000);
    return () => clearInterval(t);
  }, [sessionStatus, fetchRequests]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  );

  const pendingCount = pending.length;

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const ids = new Set(pending.map((r) => r.requestId));

    if (!initializedRef.current) {
      prevPendingIdsRef.current = ids;
      initializedRef.current = true;
      return;
    }

    const added = pending.filter(
      (r) =>
        !prevPendingIdsRef.current.has(r.requestId) &&
        !dismissedModalIdsRef.current.has(r.requestId)
    );
    prevPendingIdsRef.current = ids;

    if (added.length === 0 || modalRequest) return;

    added.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const next = added[0];
    setSelectedRequest(next);
    setModalRequest(next);
    requestAnimationFrame(() => setModalVisible(true));
  }, [pending, sessionStatus, modalRequest, setSelectedRequest]);

  const dismissNotification = useCallback(() => {
    if (modalRequest) {
      dismissedModalIdsRef.current.add(modalRequest.requestId);
    }
    setModalVisible(false);
    setSelectedRequest(null);
    setTimeout(() => setModalRequest(null), 280);
  }, [modalRequest, setSelectedRequest]);

  const openRequestModal = useCallback(
    (req: VerificationRequest) => {
      setSelectedRequest(req);
      dismissedModalIdsRef.current.delete(req.requestId);
      setModalRequest(req);
      setModalVisible(true);
    },
    [setSelectedRequest]
  );

  const handleApproved = useCallback(() => {
    if (modalRequest) {
      dismissedModalIdsRef.current.add(modalRequest.requestId);
    }
    setModalVisible(false);
    setSelectedRequest(null);
    setModalRequest(null);
    void fetchRequests();
  }, [modalRequest, setSelectedRequest, fetchRequests]);

  const handleDenied = useCallback(() => {
    dismissNotification();
    void fetchRequests();
  }, [dismissNotification, fetchRequests]);

  const value = useMemo(
    () => ({ pendingCount, openRequestModal }),
    [pendingCount, openRequestModal]
  );

  return (
    <RequestNotificationsContext.Provider value={value}>
      {children}
      <RequestNotificationModal
        request={modalRequest}
        open={modalVisible && modalRequest !== null}
        onClose={dismissNotification}
        onApproved={handleApproved}
        onDenied={handleDenied}
      />
    </RequestNotificationsContext.Provider>
  );
}
