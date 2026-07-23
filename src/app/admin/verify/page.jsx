"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  adminAuthClient,
} from "../../../lib/adminAuthClient";

const VERIFICATION_MODES = {
  TOTP: "totp",
  BACKUP: "backup",
};

function normalizeTotpCode(
  value
) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

function normalizeBackupCode(
  value
) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, 128);
}

function getSafeVerificationError(
  error,
  mode
) {
  const code = String(
    error?.code || ""
  ).toUpperCase();

  const status = Number(
    error?.statusCode ||
      error?.status ||
      0
  );

  if (
    status === 429 ||
    code.includes(
      "ACCOUNT_TEMPORARILY_LOCKED"
    )
  ) {
    return "Too many failed verification attempts. This account is temporarily locked.";
  }

  if (
    code.includes("RATE_LIMIT") ||
    code.includes("TOO_MANY")
  ) {
    return "Too many verification attempts. Wait briefly before trying again.";
  }

  if (
    code.includes("COOKIE") ||
    code.includes("CHALLENGE") ||
    code.includes("SESSION") ||
    code.includes("EXPIRED")
  ) {
    return "The secure verification request has expired. Return to Admin Login and sign in again.";
  }

  if (
    mode ===
    VERIFICATION_MODES.BACKUP
  ) {
    return "The recovery code is invalid, expired, or has already been used.";
  }

  return "The Authenticator code is invalid or has expired.";
}

function VerificationShell({
  children,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] px-5 py-8 text-[#f1ece4] sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-14rem] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-white/[0.025] blur-3xl" />

        <div className="absolute bottom-[-18rem] right-[-12rem] h-[40rem] w-[40rem] rounded-full bg-white/[0.02] blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden border border-white/10 bg-[#0b0b0b] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-full overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.075),transparent_38%),linear-gradient(145deg,#101010_0%,#080808_60%,#111111_100%)]" />

            <div className="absolute left-[12%] top-[16%] h-[24rem] w-[17rem] rotate-[19deg] border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent shadow-2xl" />

            <div className="absolute bottom-[8%] right-[7%] h-[20rem] w-[14rem] rotate-[-17deg] border border-white/[0.05] bg-gradient-to-tl from-white/[0.035] to-transparent" />
          </div>

          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.52em] text-neutral-500">
              OBSIDIAN / Secure System
            </p>

            <div className="mt-8 h-px w-24 bg-white/20" />
          </div>

          <div className="relative max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.42em] text-neutral-600">
              Second Verification
            </p>

            <h1 className="font-heading mt-6 text-7xl font-light leading-[0.88] xl:text-[6.3rem]">
              Finished With
              <span className="block text-neutral-500">
                Precision.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-sm leading-7 text-neutral-500">
              Your password has been
              accepted. Complete the
              rotating second-factor
              verification before the
              private administrative
              session is established.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px border border-white/10 bg-white/10">
            {[
              [
                "01",
                "Password",
              ],
              [
                "02",
                "Second Factor",
              ],
              [
                "03",
                "Secure Session",
              ],
            ].map(
              ([
                number,
                label,
              ]) => (
                <div
                  key={number}
                  className="bg-[#0b0b0b] p-5"
                >
                  <span className="text-[9px] tracking-[0.3em] text-neutral-700">
                    {number}
                  </span>

                  <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                    {label}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        <section className="flex min-h-full items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function SessionCheckingScreen() {
  return (
    <VerificationShell>
      <div
        role="status"
        className="border border-white/10 bg-white/[0.025] p-6"
      >
        <div className="flex items-center gap-4">
          <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-white" />

          <div>
            <p className="text-sm text-neutral-300">
              Checking secure session
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-600">
              Confirming the current
              authentication state.
            </p>
          </div>
        </div>
      </div>
    </VerificationShell>
  );
}

export default function AdminVerificationPage() {
  const router =
    useRouter();

  const totpInputRef =
    useRef(null);

  const backupInputRef =
    useRef(null);

  const [
    mode,
    setMode,
  ] = useState(
    VERIFICATION_MODES.TOTP
  );

  const [
    totpCode,
    setTotpCode,
  ] = useState("");

  const [
    backupCode,
    setBackupCode,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isCheckingSession,
    setIsCheckingSession,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const sessionResult =
          await adminAuthClient.getSession();

        const user =
          sessionResult?.data?.user;

        if (!user) {
          if (!cancelled) {
            setIsCheckingSession(
              false
            );
          }

          return;
        }

        const role = String(
          user.role || ""
        ).toLowerCase();

        if (role !== "admin") {
          await adminAuthClient.signOut();

          if (!cancelled) {
            setError(
              "This account is not authorised for private administration."
            );

            setIsCheckingSession(
              false
            );
          }

          return;
        }

        if (cancelled) {
          return;
        }

        if (
          user.twoFactorEnabled ===
          true
        ) {
          router.replace("/admin");
        } else {
          router.replace(
            "/admin/security/setup"
          );
        }

        router.refresh();
      } catch {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    if (
      mode ===
      VERIFICATION_MODES.TOTP
    ) {
      totpInputRef.current?.focus();
    } else {
      backupInputRef.current?.focus();
    }
  }, [
    isCheckingSession,
    mode,
  ]);

  async function completeSecureLogin() {
    const sessionResult =
      await adminAuthClient.getSession();

    const user =
      sessionResult?.data?.user;

    if (!user) {
      throw new Error(
        "SESSION_NOT_CREATED"
      );
    }

    const role = String(
      user.role || ""
    ).toLowerCase();

    if (role !== "admin") {
      await adminAuthClient.signOut();

      throw new Error(
        "ADMIN_ROLE_REQUIRED"
      );
    }

    if (
      user.twoFactorEnabled !==
      true
    ) {
      throw new Error(
        "TWO_FACTOR_NOT_ENABLED"
      );
    }

    router.replace("/admin");
    router.refresh();
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const isBackupMode =
      mode ===
      VERIFICATION_MODES.BACKUP;

    const submittedCode =
      isBackupMode
        ? normalizeBackupCode(
            backupCode
          )
        : normalizeTotpCode(
            totpCode
          );

    if (
      !isBackupMode &&
      submittedCode.length !== 6
    ) {
      setError(
        "Enter the current 6-digit Authenticator code."
      );

      return;
    }

    if (
      isBackupMode &&
      submittedCode.length < 4
    ) {
      setError(
        "Enter one of your unused recovery codes."
      );

      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let verificationResult;

      if (isBackupMode) {
        verificationResult =
          await adminAuthClient.twoFactor.verifyBackupCode(
            {
              code:
                submittedCode,

              disableSession:
                false,

              /*
               * Privileged Admin devices
               * are never trusted for
               * future login bypass.
               */
              trustDevice:
                false,
            }
          );
      } else {
        verificationResult =
          await adminAuthClient.twoFactor.verifyTotp(
            {
              code:
                submittedCode,

              trustDevice:
                false,
            }
          );
      }

      if (
        verificationResult?.error ||
        !verificationResult?.data
      ) {
        setError(
          getSafeVerificationError(
            verificationResult?.error,
            mode
          )
        );

        setTotpCode("");
        setBackupCode("");

        return;
      }

      await completeSecureLogin();
    } catch (requestError) {
      console.error(
        "Admin second-factor verification failed:",
        requestError
      );

      const internalCode = String(
        requestError?.message || ""
      ).toUpperCase();

      if (
        internalCode ===
        "ADMIN_ROLE_REQUIRED"
      ) {
        setError(
          "This account is not authorised for private administration."
        );
      } else if (
        internalCode ===
        "TWO_FACTOR_NOT_ENABLED"
      ) {
        router.replace(
          "/admin/security/setup"
        );

        router.refresh();

        return;
      } else if (
        internalCode ===
        "SESSION_NOT_CREATED"
      ) {
        setError(
          "The secure session could not be established. Return to Admin Login and sign in again."
        );
      } else {
        setError(
          "Secure verification is temporarily unavailable. Return to Admin Login and try again."
        );
      }

      setTotpCode("");
      setBackupCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(
    nextMode
  ) {
    if (
      isSubmitting ||
      nextMode === mode
    ) {
      return;
    }

    setMode(nextMode);
    setError("");
    setTotpCode("");
    setBackupCode("");
  }

  if (isCheckingSession) {
    return (
      <SessionCheckingScreen />
    );
  }

  const isBackupMode =
    mode ===
    VERIFICATION_MODES.BACKUP;

  return (
    <VerificationShell>
      <div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-neutral-600">
              Verification Required
            </p>

            <h2 className="font-heading mt-5 text-5xl font-light sm:text-6xl">
              Second Factor
            </h2>
          </div>

          <div
            aria-hidden="true"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border border-white/10"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300 shadow-[0_0_14px_rgba(253,224,71,0.45)]" />
          </div>
        </div>

        <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-500">
          {isBackupMode
            ? "Enter one unused recovery code. A successfully used code cannot be used again."
            : "Open your Authenticator App and enter the current rotating 6-digit code."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-px border border-white/10 bg-white/10 p-px">
          <button
            type="button"
            onClick={() =>
              changeMode(
                VERIFICATION_MODES.TOTP
              )
            }
            aria-pressed={
              !isBackupMode
            }
            className={`px-4 py-4 text-[10px] uppercase tracking-[0.24em] transition ${
              !isBackupMode
                ? "bg-[#f1ece4] text-[#080808]"
                : "bg-[#0b0b0b] text-neutral-500 hover:text-neutral-200"
            }`}
          >
            Authenticator
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode(
                VERIFICATION_MODES.BACKUP
              )
            }
            aria-pressed={
              isBackupMode
            }
            className={`px-4 py-4 text-[10px] uppercase tracking-[0.24em] transition ${
              isBackupMode
                ? "bg-[#f1ece4] text-[#080808]"
                : "bg-[#0b0b0b] text-neutral-500 hover:text-neutral-200"
            }`}
          >
            Recovery Code
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8"
          noValidate
        >
          {isBackupMode ? (
            <div>
              <label
                htmlFor="admin-backup-code"
                className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-neutral-500"
              >
                Unused Recovery Code
              </label>

              <input
                ref={backupInputRef}
                id="admin-backup-code"
                type="text"
                value={backupCode}
                onChange={(
                  event
                ) => {
                  setBackupCode(
                    event.target.value
                      .slice(0, 128)
                  );

                  setError("");
                }}
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={128}
                required
                placeholder="Enter recovery code"
                className="w-full rounded-none border border-white/10 bg-white/[0.035] px-5 py-5 font-mono text-sm tracking-[0.15em] text-[#f1ece4] outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-700 hover:border-white/20 focus:border-white/40 focus:bg-white/[0.05]"
              />

              <p className="mt-3 text-xs leading-5 text-neutral-700">
                Recovery codes are
                single-use credentials.
                Store remaining codes
                privately and offline.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="admin-totp-code"
                className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-neutral-500"
              >
                6-Digit Authenticator Code
              </label>

              <input
                ref={totpInputRef}
                id="admin-totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(
                  event
                ) => {
                  setTotpCode(
                    normalizeTotpCode(
                      event.target
                        .value
                    )
                  );

                  setError("");
                }}
                maxLength={6}
                required
                placeholder="000000"
                className="w-full rounded-none border border-white/10 bg-white/[0.035] px-5 py-5 text-center font-mono text-3xl tracking-[0.45em] text-[#f1ece4] outline-none transition placeholder:text-neutral-800 hover:border-white/20 focus:border-white/40 focus:bg-white/[0.05]"
              />

              <p className="mt-3 text-xs leading-5 text-neutral-700">
                Codes rotate
                approximately every
                30 seconds.
              </p>
            </div>
          )}

          {error ? (
            <div
              role="alert"
              aria-live="polite"
              className="mt-6 border border-red-500/25 bg-red-500/[0.08] p-4"
            >
              <p className="text-sm leading-6 text-red-200">
                {error}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (isBackupMode
                ? !backupCode.trim()
                : totpCode.length !==
                  6)
            }
            className="mt-7 w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.34em] text-[#080808] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Verifying Security..."
              : "Complete Secure Login"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col justify-between gap-4 text-[10px] uppercase tracking-[0.22em] sm:flex-row sm:items-center">
            <span className="text-neutral-700">
              Trusted-device bypass
              disabled
            </span>

            <Link
              href="/admin/login"
              className="text-neutral-500 transition hover:text-neutral-200"
            >
              Return to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </VerificationShell>
  );
}