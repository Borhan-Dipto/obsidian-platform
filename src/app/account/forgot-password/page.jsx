"use client";

import Link from "next/link";
import { useState } from "react";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] =
    useState("");
  const [generalError, setGeneralError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [developmentResetUrl, setDevelopmentResetUrl] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isComplete, setIsComplete] =
    useState(false);

  function validateEmail(value) {
    const normalizedEmail =
      normalizeEmail(value);

    if (!normalizedEmail) {
      return "Please enter your email address.";
    }

    if (
      normalizedEmail.length > 254 ||
      !EMAIL_PATTERN.test(normalizedEmail)
    ) {
      return "Please enter a valid email address.";
    }

    return "";
  }

  function handleEmailChange(event) {
    const nextEmail = event.target.value;

    setEmail(nextEmail);

    if (fieldError) {
      setFieldError("");
    }

    if (generalError) {
      setGeneralError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail =
      normalizeEmail(email);

    const validationMessage =
      validateEmail(normalizedEmail);

    setFieldError("");
    setGeneralError("");
    setSuccessMessage("");
    setDevelopmentResetUrl("");

    if (validationMessage) {
      setFieldError(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/account/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        if (
          result?.field === "email" &&
          result?.message
        ) {
          setFieldError(result.message);
          return;
        }

        setGeneralError(
          result?.message ||
            "We could not process your request right now. Please try again."
        );
        return;
      }

      setSuccessMessage(
        result?.message ||
          "If an OBSIDIAN account exists for this email, password reset instructions have been prepared."
      );

      setDevelopmentResetUrl(
        typeof result?.resetUrl === "string"
          ? result.resetUrl
          : ""
      );

      setIsComplete(true);
    } catch (error) {
      console.error(
        "Forgot password request error:",
        error
      );

      setGeneralError(
        "We could not connect to the server. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTryAnotherEmail() {
    setEmail("");
    setFieldError("");
    setGeneralError("");
    setSuccessMessage("");
    setDevelopmentResetUrl("");
    setIsComplete(false);
  }

  return (
    <main className="min-h-screen bg-[#f3eee5] text-[#151515]">
      <section className="relative isolate min-h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.82),transparent_34%),radial-gradient(circle_at_85%_78%,rgba(172,153,125,0.20),transparent_33%),linear-gradient(135deg,#f7f2ea_0%,#eee7dc_48%,#f6f1e9_100%)]" />

          <div className="absolute -left-40 top-[-12rem] h-[32rem] w-[32rem] rounded-full border border-black/[0.05]" />
          <div className="absolute -left-20 top-[-7rem] h-[24rem] w-[24rem] rounded-full border border-black/[0.04]" />

          <div className="absolute -bottom-48 -right-44 h-[34rem] w-[34rem] rounded-full border border-black/[0.05]" />
          <div className="absolute -bottom-28 -right-20 h-[24rem] w-[24rem] rounded-full border border-black/[0.04]" />

          <div className="absolute inset-y-0 left-1/2 hidden w-px bg-black/[0.06] lg:block" />
        </div>

        <div className="relative mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-2">
          <aside className="relative hidden min-h-screen overflow-hidden bg-[#11110f] px-12 py-12 text-[#f4efe7] lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_85%_82%,rgba(173,142,102,0.16),transparent_35%),linear-gradient(145deg,#171713_0%,#0d0d0b_58%,#191712_100%)]" />

              <div className="absolute left-[12%] top-[18%] h-72 w-72 rotate-12 rounded-[42%_58%_36%_64%/51%_39%_61%_49%] border border-white/[0.07]" />
              <div className="absolute bottom-[11%] right-[8%] h-96 w-96 -rotate-12 rounded-[61%_39%_54%_46%/37%_62%_38%_63%] border border-white/[0.06]" />

              <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.04]" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.04]" />
            </div>

            <div className="relative z-10">
              <Link
                href="/"
                className="inline-flex items-center gap-4"
              >
                <span className="flex h-12 w-12 items-center justify-center border border-white/20">
                  <span className="h-5 w-5 rotate-45 border border-white/80" />
                </span>

                <span className="text-[0.8rem] font-medium tracking-[0.42em]">
                  OBSIDIAN
                </span>
              </Link>
            </div>

            <div className="relative z-10 max-w-xl">
              <p className="mb-8 text-[0.68rem] font-medium uppercase tracking-[0.38em] text-white/50">
                Private access restoration
              </p>

              <h1 className="max-w-lg font-serif text-5xl font-light leading-[1.03] tracking-[-0.035em] xl:text-7xl">
                Return to your
                <span className="block italic text-[#c8b79f]">
                  personal archive.
                </span>
              </h1>

              <p className="mt-8 max-w-md text-sm leading-7 text-white/58 xl:text-[0.95rem]">
                Securely restore access to
                your OBSIDIAN account and
                continue managing your
                orders, wishlist and private
                collection.
              </p>
            </div>

            <div className="relative z-10 flex items-end justify-between gap-8 border-t border-white/10 pt-8">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/35">
                  Security
                </p>

                <p className="mt-3 max-w-xs text-xs leading-6 text-white/55">
                  Reset links are temporary,
                  encrypted and valid for a
                  limited time.
                </p>
              </div>

              <p className="whitespace-nowrap text-[0.62rem] uppercase tracking-[0.28em] text-white/30">
                Built under pressure
              </p>
            </div>
          </aside>

          <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
            <div className="w-full max-w-[34rem]">
              <div className="mb-10 flex items-center justify-between lg:hidden">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center border border-black/20">
                    <span className="h-4 w-4 rotate-45 border border-black/75" />
                  </span>

                  <span className="text-[0.72rem] font-semibold tracking-[0.36em]">
                    OBSIDIAN
                  </span>
                </Link>

                <Link
                  href="/account/login"
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-black/55 transition hover:text-black"
                >
                  Sign in
                </Link>
              </div>

              <div className="border border-black/[0.08] bg-white/72 p-6 shadow-[0_30px_100px_rgba(38,31,21,0.11)] backdrop-blur-xl sm:p-9 xl:p-11">
                {!isComplete ? (
                  <>
                    <div className="mb-9">
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-black/40">
                        Account recovery
                      </p>

                      <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl">
                        Forgot your
                        <span className="block italic text-[#7c6851]">
                          password?
                        </span>
                      </h2>

                      <p className="mt-5 max-w-md text-sm leading-7 text-black/55">
                        Enter the email
                        associated with your
                        account. We will
                        prepare secure
                        instructions to reset
                        your password.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-6"
                    >
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2.5 block text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-black/50"
                        >
                          Email address
                        </label>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={
                            handleEmailChange
                          }
                          disabled={
                            isSubmitting
                          }
                          placeholder="you@example.com"
                          aria-invalid={
                            Boolean(
                              fieldError
                            )
                          }
                          aria-describedby={
                            fieldError
                              ? "email-error"
                              : undefined
                          }
                          className={`h-14 w-full border bg-white/70 px-4 text-[0.95rem] outline-none transition duration-200 placeholder:text-black/25 disabled:cursor-not-allowed disabled:opacity-60 ${
                            fieldError
                              ? "border-[#9d4d43] focus:border-[#9d4d43]"
                              : "border-black/10 focus:border-black/45"
                          }`}
                        />

                        {fieldError ? (
                          <p
                            id="email-error"
                            className="mt-2.5 text-xs leading-5 text-[#8d3f36]"
                          >
                            {fieldError}
                          </p>
                        ) : null}
                      </div>

                      {generalError ? (
                        <div
                          role="alert"
                          className="border border-[#9d4d43]/20 bg-[#9d4d43]/[0.06] px-4 py-3.5 text-sm leading-6 text-[#7d3831]"
                        >
                          {generalError}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative flex h-14 w-full items-center justify-center overflow-hidden bg-[#141411] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.27em] text-white transition duration-300 hover:bg-[#26231e] disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        <span className="relative z-10">
                          {isSubmitting
                            ? "Preparing access"
                            : "Continue securely"}
                        </span>

                        {!isSubmitting ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/10 transition-all duration-700 group-hover:left-[115%]"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="ml-3 h-4 w-4 animate-spin rounded-full border border-white/35 border-t-white"
                          />
                        )}
                      </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                      <span className="h-px flex-1 bg-black/[0.08]" />
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-black/30">
                        Remembered it?
                      </span>
                      <span className="h-px flex-1 bg-black/[0.08]" />
                    </div>

                    <Link
                      href="/account/login"
                      className="mt-7 flex h-13 w-full items-center justify-center border border-black/12 bg-transparent px-5 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-black/65 transition hover:border-black/35 hover:bg-black/[0.025] hover:text-black"
                    >
                      Return to sign in
                    </Link>
                  </>
                ) : (
                  <div className="py-2">
                    <div className="flex h-16 w-16 items-center justify-center border border-black/10 bg-[#eee6da]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="h-7 w-7"
                      >
                        <path
                          d="M5 12.5L9.2 16.5L19 6.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <p className="mt-8 text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-black/40">
                      Request received
                    </p>

                    <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl">
                      Check your
                      <span className="block italic text-[#7c6851]">
                        secure access.
                      </span>
                    </h2>

                    <p className="mt-5 text-sm leading-7 text-black/58">
                      {successMessage}
                    </p>

                    <div className="mt-7 border border-black/[0.08] bg-[#f5f0e8] px-4 py-4">
                      <p className="text-xs leading-6 text-black/55">
                        For your security, we
                        show the same message
                        whether or not an
                        account exists for
                        this email.
                      </p>
                    </div>

                    {developmentResetUrl ? (
                      <div className="mt-6 border border-[#967c5c]/25 bg-[#967c5c]/[0.07] p-4">
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#6d5943]">
                          Development testing
                        </p>

                        <p className="mt-2 text-xs leading-6 text-black/55">
                          Email delivery is
                          not connected yet.
                          Use this secure link
                          to test the reset
                          flow locally.
                        </p>

                        <Link
                          href={
                            developmentResetUrl
                          }
                          className="mt-4 inline-flex min-h-11 items-center justify-center bg-[#171714] px-5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#2b2822]"
                        >
                          Open reset page
                        </Link>
                      </div>
                    ) : null}

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={
                          handleTryAnotherEmail
                        }
                        className="flex min-h-13 items-center justify-center border border-black/12 px-5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-black/60 transition hover:border-black/35 hover:text-black"
                      >
                        Try another email
                      </button>

                      <Link
                        href="/account/login"
                        className="flex min-h-13 items-center justify-center bg-[#151512] px-5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#2a2722]"
                      >
                        Return to sign in
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-7 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-black/35">
                  Secure customer access
                </p>

                <p className="text-xs text-black/38">
                  © {new Date().getFullYear()}{" "}
                  OBSIDIAN
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}