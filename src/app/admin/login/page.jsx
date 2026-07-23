"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  adminAuthClient,
} from "../../../lib/adminAuthClient";

function normalizeEmail(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

function getSafeLoginError(error) {
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
    code.includes("RATE_LIMIT") ||
    code.includes("TOO_MANY")
  ) {
    return "Too many login attempts. Wait briefly before trying again.";
  }

  if (
    code.includes("BANNED") ||
    code.includes("SUSPENDED") ||
    code.includes("DISABLED")
  ) {
    return "This administrator account is unavailable.";
  }

  return "The email or password is incorrect.";
}

function LoginShell({
  children,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] px-5 py-8 text-[#f1ece4] sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-12rem] top-[-14rem] h-[32rem] w-[32rem] rounded-full bg-white/[0.025] blur-3xl" />

        <div className="absolute bottom-[-16rem] right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-white/[0.02] blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden border border-white/10 bg-[#0b0b0b] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden min-h-full overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_38%),linear-gradient(145deg,#101010_0%,#080808_58%,#111111_100%)]" />

            <div className="absolute left-[12%] top-[16%] h-[24rem] w-[17rem] rotate-[19deg] border border-white/[0.07] bg-gradient-to-br from-white/[0.055] to-transparent shadow-2xl" />

            <div className="absolute bottom-[8%] right-[6%] h-[20rem] w-[14rem] rotate-[-17deg] border border-white/[0.05] bg-gradient-to-tl from-white/[0.035] to-transparent" />
          </div>

          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.52em] text-neutral-500">
              OBSIDIAN / Secure System
            </p>

            <div className="mt-8 h-px w-24 bg-white/20" />
          </div>

          <div className="relative max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.42em] text-neutral-600">
              Private Administration
            </p>

            <h1 className="font-heading mt-6 text-7xl font-light leading-[0.88] xl:text-[6.3rem]">
              Built Under
              <span className="block text-neutral-500">
                Pressure.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-sm leading-7 text-neutral-500">
              Restricted operational access
              for authorised OBSIDIAN
              administrators. Every secure
              session is protected by password,
              role verification and a rotating
              Authenticator code.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-px border border-white/10 bg-white/10">
            {[
              [
                "01",
                "Identity",
              ],
              [
                "02",
                "Authority",
              ],
              [
                "03",
                "Second Factor",
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
    <LoginShell>
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

            <p className="mt-1 text-xs text-neutral-600">
              Verifying private administrator access.
            </p>
          </div>
        </div>
      </div>
    </LoginShell>
  );
}

export default function AdminLoginPage() {
  const router =
    useRouter();

  const {
    data: existingSession,
    isPending:
      isSessionPending,
  } =
    adminAuthClient.useSession();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
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
    isResolvingSession,
    setIsResolvingSession,
  ] = useState(true);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    let cancelled = false;

    async function resolveExistingSession() {
      const user =
        existingSession?.user;

      if (!user) {
        if (!cancelled) {
          setIsResolvingSession(
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

          setIsResolvingSession(
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
    }

    resolveExistingSession();

    return () => {
      cancelled = true;
    };
  }, [
    existingSession,
    isSessionPending,
    router,
  ]);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setError(
        "Enter a valid administrator email address."
      );

      return;
    }

    if (
      password.length < 14 ||
      password.length > 128
    ) {
      setError(
        "The email or password is incorrect."
      );

      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const {
        data,
        error:
          signInError,
      } =
        await adminAuthClient.signIn.email(
          {
            email:
              normalizedEmail,

            password,

            /*
             * Privileged Admin sessions
             * are not persisted as a
             * remembered browser login.
             */
            rememberMe: false,
          }
        );

      setPassword("");

      if (signInError) {
        setError(
          getSafeLoginError(
            signInError
          )
        );

        return;
      }

      /*
       * Better Auth creates a temporary
       * second-factor challenge instead
       * of a complete session here.
       */
      if (
        data?.twoFactorRedirect ===
        true
      ) {
        router.replace(
          "/admin/verify"
        );

        return;
      }

      let authenticatedUser =
        data?.user || null;

      if (!authenticatedUser) {
        const sessionResult =
          await adminAuthClient.getSession();

        authenticatedUser =
          sessionResult?.data?.user ||
          null;
      }

      if (!authenticatedUser) {
        setError(
          "The secure session could not be established."
        );

        return;
      }

      const role = String(
        authenticatedUser.role ||
          ""
      ).toLowerCase();

      if (role !== "admin") {
        await adminAuthClient.signOut();

        setError(
          "This account is not authorised for private administration."
        );

        return;
      }

      if (
        authenticatedUser
          .twoFactorEnabled === true
      ) {
        /*
         * This is a defensive fallback.
         * A 2FA-enabled account should
         * normally enter the redirect
         * branch above.
         */
        router.replace(
          "/admin/verify"
        );

        return;
      }

      router.replace(
        "/admin/security/setup"
      );

      router.refresh();
    } catch (requestError) {
      console.error(
        "Admin login request failed:",
        requestError
      );

      setPassword("");

      setError(
        "Secure login is temporarily unavailable. Try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    isSessionPending ||
    isResolvingSession
  ) {
    return (
      <SessionCheckingScreen />
    );
  }

  return (
    <LoginShell>
      <div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-neutral-600">
              Authorised Access Only
            </p>

            <h2 className="font-heading mt-5 text-5xl font-light sm:text-6xl">
              Admin Login
            </h2>
          </div>

          <div
            aria-hidden="true"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border border-white/10"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.55)]" />
          </div>
        </div>

        <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-500">
          Enter your private administrator
          credentials. Accounts protected by
          two-factor authentication will
          continue to the verification stage.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6"
          noValidate
        >
          <div>
            <label
              htmlFor="admin-email"
              className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-neutral-500"
            >
              Administrator Email
            </label>

            <input
              id="admin-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(
                event
              ) => {
                setEmail(
                  event.target.value
                );

                setError("");
              }}
              maxLength={254}
              required
              autoFocus
              placeholder="admin@example.com"
              className="w-full rounded-none border border-white/10 bg-white/[0.035] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 hover:border-white/20 focus:border-white/40 focus:bg-white/[0.05]"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <label
                htmlFor="admin-password"
                className="block text-[10px] uppercase tracking-[0.3em] text-neutral-500"
              >
                Password
              </label>

              <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-700">
                Encrypted Authentication
              </span>
            </div>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(
                event
              ) => {
                setPassword(
                  event.target.value
                );

                setError("");
              }}
              minLength={14}
              maxLength={128}
              required
              placeholder="Enter private password"
              className="w-full rounded-none border border-white/10 bg-white/[0.035] px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 hover:border-white/20 focus:border-white/40 focus:bg-white/[0.05]"
            />
          </div>

          {error ? (
            <div
              role="alert"
              aria-live="polite"
              className="border border-red-500/25 bg-red-500/[0.08] p-4"
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
              !email.trim() ||
              !password
            }
            className="group relative w-full overflow-hidden bg-[#f1ece4] px-8 py-5 text-xs font-semibold uppercase tracking-[0.34em] text-[#080808] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="relative z-10">
              {isSubmitting
                ? "Verifying Access..."
                : "Continue Securely"}
            </span>
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col justify-between gap-4 text-[10px] uppercase tracking-[0.22em] text-neutral-700 sm:flex-row sm:items-center">
            <span>
              Session protection active
            </span>

            <Link
              href="/"
              className="text-neutral-500 transition hover:text-neutral-200"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    </LoginShell>
  );
}