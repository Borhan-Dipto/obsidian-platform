"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  adminAuthClient,
} from "../../../../lib/adminAuthClient";

const STAGES = {
  PASSWORD: "password",
  AUTHENTICATOR: "authenticator",
  COMPLETE: "complete",
};

function normalizeCode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

function getSafeErrorMessage(
  error,
  fallback
) {
  const code = String(
    error?.code || ""
  ).toUpperCase();

  if (
    code ===
    "ACCOUNT_TEMPORARILY_LOCKED"
  ) {
    return "Too many verification attempts. This account is temporarily locked.";
  }

  if (
    code.includes("PASSWORD")
  ) {
    return "The Admin password could not be verified.";
  }

  if (
    code.includes("TOTP") ||
    code.includes("TWO_FACTOR") ||
    code.includes("OTP")
  ) {
    return "The Authenticator code is invalid or has expired.";
  }

  return fallback;
}

function getManualSecret(
  totpUri
) {
  try {
    return (
      new URL(
        totpUri
      ).searchParams.get(
        "secret"
      ) || ""
    );
  } catch {
    return "";
  }
}

async function createQrCode(
  value
) {
  const qrCodeModule =
    await import("qrcode");

  const toDataURL =
    qrCodeModule.toDataURL ||
    qrCodeModule.default
      ?.toDataURL;

  if (
    typeof toDataURL !==
    "function"
  ) {
    throw new Error(
      "QR code generator is unavailable."
    );
  }

  return toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}

async function copyText(
  value
) {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      value
    );

    return;
  }

  const textArea =
    document.createElement(
      "textarea"
    );

  textArea.value = value;
  textArea.setAttribute(
    "readonly",
    ""
  );

  textArea.style.position =
    "fixed";

  textArea.style.opacity =
    "0";

  document.body.appendChild(
    textArea
  );

  textArea.select();

  const copied =
    document.execCommand(
      "copy"
    );

  document.body.removeChild(
    textArea
  );

  if (!copied) {
    throw new Error(
      "Copy failed."
    );
  }
}

function SecurityShell({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="max-w-lg">
          <p className="text-[10px] uppercase tracking-[0.48em] text-neutral-500">
            OBSIDIAN / Private Access
          </p>

          <h1 className="font-heading mt-7 text-5xl font-light leading-[0.95] sm:text-6xl lg:text-7xl">
            Secure
            <span className="block text-neutral-500">
              Administration
            </span>
          </h1>

          <p className="mt-7 max-w-md text-sm leading-7 text-neutral-400">
            This private portal requires
            your password and a rotating
            Authenticator App code before
            administrative access is
            granted.
          </p>

          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              [
                "01",
                "Password",
              ],
              [
                "02",
                "Authenticator",
              ],
              [
                "03",
                "Recovery Codes",
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
                  <span className="text-[9px] tracking-[0.35em] text-neutral-600">
                    {number}
                  </span>

                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-neutral-300">
                    {label}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        <section className="border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl sm:p-8 lg:p-10">
          <div className="border-b border-white/10 pb-7">
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500">
              {eyebrow}
            </p>

            <h2 className="font-heading mt-4 text-4xl font-light sm:text-5xl">
              {title}
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500">
              {description}
            </p>
          </div>

          <div className="pt-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <SecurityShell
      eyebrow="Security Check"
      title="Verifying Session"
      description="Confirming your private Admin identity and account permissions."
    >
      <div
        className="flex items-center gap-4 border border-white/10 bg-white/[0.03] p-5"
        role="status"
      >
        <span className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-white" />

        <p className="text-sm text-neutral-400">
          Checking secure session...
        </p>
      </div>
    </SecurityShell>
  );
}

export default function AdminSecuritySetupPage() {
  const router =
    useRouter();

  const {
    data: session,
    isPending,
  } =
    adminAuthClient.useSession();

  const [
    stage,
    setStage,
  ] = useState(
    STAGES.PASSWORD
  );

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [
    totpUri,
    setTotpUri,
  ] = useState("");

  const [
    qrCodeUrl,
    setQrCodeUrl,
  ] = useState("");

  const [
    backupCodes,
    setBackupCodes,
  ] = useState([]);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    codesCopied,
    setCodesCopied,
  ] = useState(false);

  const manualSecret =
    useMemo(
      () =>
        getManualSecret(
          totpUri
        ),
      [totpUri]
    );

  const adminRole =
    String(
      session?.user?.role ||
        ""
    ).toLowerCase();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.replace(
        "/admin/login"
      );

      return;
    }

    if (
      adminRole !== "admin"
    ) {
      adminAuthClient.signOut({
        fetchOptions: {
          onSuccess() {
            router.replace(
              "/admin/login"
            );
          },
        },
      });

      return;
    }

    if (
      session.user
        .twoFactorEnabled ===
        true &&
      stage !== STAGES.COMPLETE
    ) {
      router.replace("/admin");
    }
  }, [
    adminRole,
    isPending,
    router,
    session,
    stage,
  ]);

  async function handleEnableTwoFactor(
    event
  ) {
    event.preventDefault();

    if (
      isSubmitting ||
      !password
    ) {
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const {
        data,
        error:
          enableError,
      } =
        await adminAuthClient.twoFactor.enable(
          {
            password,
            issuer:
              "OBSIDIAN Admin",
          }
        );

      if (
        enableError ||
        !data?.totpURI
      ) {
        setError(
          getSafeErrorMessage(
            enableError,
            "Two-factor authentication could not be prepared."
          )
        );

        return;
      }

      const generatedQrCode =
        await createQrCode(
          data.totpURI
        );

      setTotpUri(
        data.totpURI
      );

      setQrCodeUrl(
        generatedQrCode
      );

      setBackupCodes(
        Array.isArray(
          data.backupCodes
        )
          ? data.backupCodes
          : []
      );

      setPassword("");
      setVerificationCode("");
      setStage(
        STAGES.AUTHENTICATOR
      );

      setMessage(
        "Authenticator setup created. Scan the QR code and enter the current 6-digit code."
      );
    } catch (requestError) {
      console.error(
        "Admin 2FA setup error:",
        requestError
      );

      setError(
        "Two-factor authentication could not be prepared."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(
    event
  ) {
    event.preventDefault();

    if (
      isSubmitting ||
      verificationCode.length !==
        6
    ) {
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const {
        data,
        error:
          verificationError,
      } =
        await adminAuthClient.twoFactor.verifyTotp(
          {
            code:
              verificationCode,

            /*
             * Trusted devices remain disabled
             * for privileged Admin access.
             */
            trustDevice: false,
          }
        );

      if (
        verificationError ||
        !data
      ) {
        setError(
          getSafeErrorMessage(
            verificationError,
            "The Authenticator code is invalid or has expired."
          )
        );

        setVerificationCode("");

        return;
      }

      setVerificationCode("");
      setStage(
        STAGES.COMPLETE
      );

      setMessage(
        "Two-factor authentication is now active."
      );
    } catch (requestError) {
      console.error(
        "Admin TOTP verification error:",
        requestError
      );

      setError(
        "The Authenticator code could not be verified."
      );

      setVerificationCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopySecret() {
    if (!manualSecret) {
      return;
    }

    try {
      await copyText(
        manualSecret
      );

      setMessage(
        "Manual setup key copied."
      );
    } catch {
      setError(
        "Manual setup key could not be copied."
      );
    }
  }

  async function handleCopyBackupCodes() {
    if (
      backupCodes.length === 0
    ) {
      return;
    }

    try {
      await copyText(
        backupCodes.join("\n")
      );

      setCodesCopied(true);
      setError("");

      setMessage(
        "Recovery codes copied. Store them somewhere private and offline."
      );
    } catch {
      setError(
        "Recovery codes could not be copied."
      );
    }
  }

  function enterAdmin() {
    router.replace("/admin");
    router.refresh();
  }

  if (
    isPending ||
    !session?.user ||
    adminRole !== "admin"
  ) {
    return <LoadingScreen />;
  }

  if (
    stage ===
    STAGES.PASSWORD
  ) {
    return (
      <SecurityShell
        eyebrow="Step 01 / Identity"
        title="Confirm Password"
        description="Confirm the private Admin password before creating the Authenticator credential."
      >
        <form
          onSubmit={
            handleEnableTwoFactor
          }
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="admin-security-password"
              className="mb-3 block text-[10px] uppercase tracking-[0.32em] text-neutral-500"
            >
              Admin Password
            </label>

            <input
              id="admin-security-password"
              type="password"
              value={password}
              onChange={(
                event
              ) => {
                setPassword(
                  event.target.value
                );

                setError("");
              }}
              autoComplete="current-password"
              minLength={14}
              maxLength={128}
              required
              autoFocus
              className="w-full border border-white/10 bg-white/[0.04] px-5 py-4 text-base outline-none transition placeholder:text-neutral-700 focus:border-white/35"
              placeholder="Enter your Admin password"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !password
            }
            className="w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#080808] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Preparing Security..."
              : "Continue Secure Setup"}
          </button>
        </form>
      </SecurityShell>
    );
  }

  if (
    stage ===
    STAGES.AUTHENTICATOR
  ) {
    return (
      <SecurityShell
        eyebrow="Step 02 / Authenticator"
        title="Secure Your Account"
        description="Scan the QR code with Google Authenticator, Microsoft Authenticator, 1Password, or another compatible Authenticator App."
      >
        <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
          <div>
            <div className="flex min-h-[320px] items-center justify-center bg-[#f1ece4] p-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="OBSIDIAN Admin Authenticator QR code"
                  width="320"
                  height="320"
                  className="h-auto w-full"
                />
              ) : null}
            </div>

            {manualSecret ? (
              <div className="mt-4 border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-600">
                  Manual Setup Key
                </p>

                <p className="mt-3 break-all font-mono text-xs leading-6 text-neutral-300">
                  {manualSecret}
                </p>

                <button
                  type="button"
                  onClick={
                    handleCopySecret
                  }
                  className="mt-4 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:text-white"
                >
                  Copy Setup Key
                </button>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={
              handleVerifyCode
            }
            className="flex flex-col justify-center"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                Verification
              </p>

              <h3 className="font-heading mt-4 text-3xl font-light">
                Enter Current Code
              </h3>

              <p className="mt-4 text-sm leading-7 text-neutral-500">
                Your Authenticator App
                generates a new 6-digit
                code approximately every
                30 seconds.
              </p>
            </div>

            <div className="mt-7">
              <label
                htmlFor="admin-totp-code"
                className="mb-3 block text-[10px] uppercase tracking-[0.32em] text-neutral-500"
              >
                6-Digit Code
              </label>

              <input
                id="admin-totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                value={
                  verificationCode
                }
                onChange={(
                  event
                ) => {
                  setVerificationCode(
                    normalizeCode(
                      event.target
                        .value
                    )
                  );

                  setError("");
                }}
                maxLength={6}
                required
                autoFocus
                className="w-full border border-white/10 bg-white/[0.04] px-5 py-5 text-center font-mono text-3xl tracking-[0.45em] outline-none transition focus:border-white/35"
                placeholder="000000"
              />
            </div>

            {message ? (
              <p
                role="status"
                className="mt-5 border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200"
              >
                {message}
              </p>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="mt-5 border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                verificationCode
                  .length !== 6
              }
              className="mt-7 w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#080808] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting
                ? "Verifying Code..."
                : "Activate Two-Factor Security"}
            </button>
          </form>
        </div>
      </SecurityShell>
    );
  }

  return (
    <SecurityShell
      eyebrow="Step 03 / Recovery"
      title="Security Activated"
      description="Save these single-use recovery codes somewhere private and offline before entering the Admin dashboard."
    >
      <div className="border border-emerald-500/20 bg-emerald-500/10 p-5">
        <p className="text-sm leading-7 text-emerald-100">
          Two-factor authentication
          is active. Your Admin
          password alone can no longer
          complete a future login.
        </p>
      </div>

      <div className="mt-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
              Single-Use Recovery Codes
            </p>

            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-500">
              Each code works once.
              Never store them inside
              the website project,
              screenshots, email, or
              public cloud notes.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleCopyBackupCodes
            }
            disabled={
              backupCodes.length ===
              0
            }
            className="shrink-0 border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.26em] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {codesCopied
              ? "Codes Copied"
              : "Copy All Codes"}
          </button>
        </div>

        <div className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {backupCodes.map(
            (backupCode, index) => (
              <div
                key={`${backupCode}-${index}`}
                className="bg-[#0b0b0b] px-5 py-4"
              >
                <span className="mr-4 text-[9px] text-neutral-700">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>

                <code className="font-mono text-sm tracking-[0.15em] text-neutral-200">
                  {backupCode}
                </code>
              </div>
            )
          )}
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className="mt-6 border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-neutral-300"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-6 border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={enterAdmin}
        className="mt-7 w-full bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#080808] transition hover:opacity-90"
      >
        Enter Secure Admin
      </button>
    </SecurityShell>
  );
}