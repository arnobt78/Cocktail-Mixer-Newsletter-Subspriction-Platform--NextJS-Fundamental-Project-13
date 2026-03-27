"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PASSKEY_LENGTH = 6;

export function AdminAccessDialog() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: PASSKEY_LENGTH }, () => ""),
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastAutoSubmittedRef = useRef("");

  const passkey = digits.join("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function updateDigit(index: number, value: string) {
    const lastChar = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = lastChar;
      return next;
    });

    if (lastChar && index < PASSKEY_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onDigitChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    updateDigit(index, event.target.value);
  }

  function onDigitKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < PASSKEY_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const next = Array.from({ length: PASSKEY_LENGTH }, (_, idx) => pasted[idx] ?? "");
    setDigits(next);
    const nextFocus = Math.min(pasted.length, PASSKEY_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  }

  async function submitPasskey(value: string) {
    setError("");
    if (value.length !== PASSKEY_LENGTH) {
      setError("Please enter the full 6-digit passkey.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: value }),
      });

      const data = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !data.ok) {
        setError(data.message ?? "Invalid passkey");
        setShakeCount((prev) => prev + 1);
        setDigits(Array.from({ length: PASSKEY_LENGTH }, () => ""));
        inputRefs.current[0]?.focus();
        return;
      }

      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPasskey(passkey);
  }

  useEffect(() => {
    if (passkey.length < PASSKEY_LENGTH) {
      lastAutoSubmittedRef.current = "";
    }
    if (passkey.length !== PASSKEY_LENGTH || isLoading) {
      return;
    }
    if (lastAutoSubmittedRef.current === passkey) {
      return;
    }
    lastAutoSubmittedRef.current = passkey;
    void submitPasskey(passkey);
  }, [passkey, isLoading]);

  function onClose() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <section className="fixed inset-0 z-[69] flex items-center justify-center px-4 py-10 sm:px-8">
      <AlertDialog open>
        <AlertDialogOverlay />
        <AlertDialogContent className="glass-panel mt-0">
          <motion.div
            animate={
              shakeCount > 0
                ? { x: [0, -6, 6, -4, 4, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.28 }}
          >
          <AlertDialogHeader>
            <div>
              <AlertDialogTitle>Admin Access Verification</AlertDialogTitle>
              <AlertDialogDescription>
                To access the admin page, please enter the passkey.
              </AlertDialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </AlertDialogHeader>

          <form onSubmit={onSubmit}>
            <div className="mb-4 grid grid-cols-6 gap-3" onPaste={onPaste}>
              {digits.map((digit, index) => (
                <input
                  key={`digit-${index + 1}`}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  value={digit}
                  onChange={(event) => onDigitChange(index, event)}
                  onKeyDown={(event) => onDigitKeyDown(index, event)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  type="password"
                  className="h-14 w-full rounded-xl border border-white/15 bg-slate-900/50 text-center text-xl font-semibold tracking-[0.2em] text-slate-100 outline-none transition focus:border-emerald-300/50 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-0"
                  aria-label={`Passkey digit ${index + 1}`}
                />
              ))}
            </div>
            {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
            <RippleButton
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg border border-emerald-300/30 bg-emerald-500/85 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              {isLoading ? "Checking..." : "Enter Admin Passkey"}
            </RippleButton>
          </form>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
