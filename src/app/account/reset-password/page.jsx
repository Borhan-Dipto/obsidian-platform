"use client";

import Link from "next/link";
import {
  Suspense,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function validatePassword(password) {
  if (!password) {
    return "Please enter your new password.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 8 characters long.";
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return "Password cannot exceed 128 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return "";
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "Not entered",
    };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (score <= 2) {
    return {
      score: 1,
      label: "Weak",
    };
  }

  if (score <= 4) {
    return {
      score: 2,
      label: "Good",
    };
  }

  return {
    score: 3,
    label: "Strong",
  };
}

function RequirementItem({
  met,
  children,
}) {
  return (
    <li
      className={`flex items-center gap-2.5 text-xs transition ${
        met
          ? "text-[#536548]"
          : "text-black/42"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
          met
            ? "border-[#536548]/45 bg-[#536548]/10"
            : "border-black/15"
        }`}
      >
        {met ? (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="h-2.5 w-2.5"
          >
            <path
              d="M3.25 8.2L6.2 11L12.8 4.6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>

      <span>{children}</span>
    </li>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  showPassword,
  onToggleVisibility,
  autoComplete,
  disabled,
  placeholder,
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2.5 block text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-black/50"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={
            showPassword
              ? "text"
              : "password"
          }
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? errorId
              : undefined
          }
          className={`h-14 w-full border bg-white/70 px-4 pr-14 text-[0.95rem] outline-none transition duration-200 placeholder:text-black/25 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-[#9d4d43] focus:border-[#9d4d43]"
              : "border-black/10 focus:border-black/45"
          }`}
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-black/42 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {showPassword ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                d="M3 3L21 21"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />

              <path
                d="M10.6 10.7A2 2 0 0013.3 13.4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />

              <path
                d="M9.5 4.5A10.6 10.6 0 0112 4.2C17.8 4.2 21 12 21 12a17.7 17.7 0 01-2.3 3.7M6.2 6.3C4.1 8 3 12 3 12s3.2 7.8 9 7.8a9.7 9.7 0 004.1-.9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                d="M3 12S6.2 4.2 12 4.2 21 12 21 12s-3.2 7.8-9 7.8S3 12 3 12Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <circle
                cx="12"
                cy="12"
                r="2.7"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          )}
        </button>
      </div>

      {error ? (
        <p
          id={errorId}
          className="mt-2.5 text-xs leading-5 text-[#8d3f36]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams =
    useSearchParams();

  const token = useMemo(
    () =>
      String(
        searchParams.get("token") ?? ""
      ).trim(),
    [searchParams]
  );

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState("");

  const [
    generalError,
    setGeneralError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isComplete,
    setIsComplete,
  ] = useState(false);

  const [
    showSuccessOverlay,
    setShowSuccessOverlay,
  ] = useState(false);

  const [
    tokenInvalidated,
    setTokenInvalidated,
  ] = useState(false);

  const tokenUnavailable =
    !token || tokenInvalidated;

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          password
        ),
      [password]
    );

  const requirements = {
    length:
      password.length >=
      MIN_PASSWORD_LENGTH,

    lowercase:
      /[a-z]/.test(password),

    uppercase:
      /[A-Z]/.test(password),

    number:
      /[0-9]/.test(password),
  };

  function handlePasswordChange(
    event
  ) {
    const nextPassword =
      event.target.value;

    setPassword(nextPassword);

    if (passwordError) {
      setPasswordError("");
    }

    if (generalError) {
      setGeneralError("");
    }
  }

  function handleConfirmPasswordChange(
    event
  ) {
    const nextConfirmPassword =
      event.target.value;

    setConfirmPassword(
      nextConfirmPassword
    );

    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }

    if (generalError) {
      setGeneralError("");
    }
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");
    setSuccessMessage("");

    if (!token) {
      setTokenInvalidated(true);

      setGeneralError(
        "This password reset link is missing or invalid."
      );

      return;
    }

    const passwordValidationMessage =
      validatePassword(password);

    if (
      passwordValidationMessage
    ) {
      setPasswordError(
        passwordValidationMessage
      );

      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(
        "Please confirm your new password."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/account/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      let result = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        const message =
          result?.message ||
          "We could not update your password right now. Please try again.";

        if (
          result?.field ===
          "password"
        ) {
          setPasswordError(
            message
          );

          return;
        }

        if (
          result?.field ===
          "confirmPassword"
        ) {
          setConfirmPasswordError(
            message
          );

          return;
        }

        if (
          result?.field ===
            "token" ||
          result?.code ===
            "INVALID_TOKEN" ||
          result?.code ===
            "INVALID_OR_EXPIRED_TOKEN"
        ) {
          setTokenInvalidated(
            true
          );
        }

        setGeneralError(message);
        return;
      }

      setSuccessMessage(
        result?.message ||
          "Your password has been updated successfully. You can now sign in with your new password."
      );

      setShowSuccessOverlay(
        true
      );

      window.setTimeout(() => {
        setIsComplete(true);

        setShowSuccessOverlay(
          false
        );
      }, 950);
    } catch (error) {
      console.error(
        "Reset password request error:",
        error
      );

      setGeneralError(
        "We could not connect to the server. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
                Secure identity renewal
              </p>

              <h1 className="max-w-lg font-serif text-5xl font-light leading-[1.03] tracking-[-0.035em] xl:text-7xl">
                Define your

                <span className="block italic text-[#c8b79f]">
                  new access.
                </span>
              </h1>

              <p className="mt-8 max-w-md text-sm leading-7 text-white/58 xl:text-[0.95rem]">
                Create a refined, secure
                password to restore your
                private OBSIDIAN account and
                continue your personal
                collection.
              </p>
            </div>

            <div className="relative z-10 flex items-end justify-between gap-8 border-t border-white/10 pt-8">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.32em] text-white/35">
                  Protection
                </p>

                <p className="mt-3 max-w-xs text-xs leading-6 text-white/55">
                  Your reset link can be
                  used once and becomes
                  invalid immediately after
                  your password is changed.
                </p>
              </div>

              <p className="whitespace-nowrap text-[0.62rem] uppercase tracking-[0.28em] text-white/30">
                Finished with precision
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

              <div className="relative overflow-hidden border border-black/[0.08] bg-white/72 p-6 shadow-[0_30px_100px_rgba(38,31,21,0.11)] backdrop-blur-xl sm:p-9 xl:p-11">
                {showSuccessOverlay ? (
                  <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#151512] text-white">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(193,172,141,0.18),transparent_42%)]"
                    />

                    <div className="relative flex flex-col items-center text-center">
                      <span className="flex h-20 w-20 animate-[pulse_1.4s_ease-in-out_infinite] items-center justify-center border border-white/20">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className="h-9 w-9"
                        >
                          <path
                            d="M5 12.5L9.2 16.5L19 6.5"
                            stroke="currentColor"
                            strokeWidth="1.35"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <p className="mt-7 text-[0.65rem] font-semibold uppercase tracking-[0.36em] text-white/65">
                        Access renewed
                      </p>
                    </div>
                  </div>
                ) : null}

                {!isComplete ? (
                  <>
                    <div className="mb-8">
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.32em] text-black/40">
                        Password renewal
                      </p>

                      <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl">
                        Create a new

                        <span className="block italic text-[#7c6851]">
                          password.
                        </span>
                      </h2>

                      <p className="mt-5 max-w-md text-sm leading-7 text-black/55">
                        Choose a secure
                        password that you
                        have not used for
                        this account before.
                      </p>
                    </div>

                    {tokenUnavailable ? (
                      <div className="mb-7 border border-[#9d4d43]/20 bg-[#9d4d43]/[0.06] p-5">
                        <div className="flex gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#9d4d43]/20 text-[#8d3f36]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                              className="h-5 w-5"
                            >
                              <path
                                d="M12 7V13"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />

                              <circle
                                cx="12"
                                cy="17"
                                r="1"
                                fill="currentColor"
                              />

                              <path
                                d="M10.2 3.9L2.8 17.1C2.1 18.4 3 20 4.5 20H19.5C21 20 21.9 18.4 21.2 17.1L13.8 3.9C13 2.6 11 2.6 10.2 3.9Z"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>

                          <div>
                            <p className="text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-[#7d3831]">
                              Link unavailable
                            </p>

                            <p className="mt-2 text-xs leading-6 text-[#7d3831]/80">
                              This reset link is
                              missing, invalid,
                              expired or has
                              already been used.
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/account/forgot-password"
                          className="mt-5 flex min-h-12 w-full items-center justify-center bg-[#171714] px-5 text-[0.62rem] font-semibold uppercase tracking-[0.21em] text-white transition hover:bg-[#2b2822]"
                        >
                          Request a new link
                        </Link>
                      </div>
                    ) : (
                      <form
                        onSubmit={
                          handleSubmit
                        }
                        noValidate
                        className="space-y-6"
                      >
                        <PasswordField
                          id="password"
                          label="New password"
                          value={password}
                          onChange={
                            handlePasswordChange
                          }
                          error={
                            passwordError
                          }
                          showPassword={
                            showPassword
                          }
                          onToggleVisibility={() =>
                            setShowPassword(
                              (current) =>
                                !current
                            )
                          }
                          autoComplete="new-password"
                          disabled={
                            isSubmitting
                          }
                          placeholder="Enter your new password"
                        />

                        {password ? (
                          <div className="-mt-2 border border-black/[0.07] bg-[#f5f0e8]/80 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-black/42">
                                Password strength
                              </p>

                              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-black/55">
                                {
                                  passwordStrength.label
                                }
                              </p>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-1.5">
                              {[1, 2, 3].map(
                                (level) => (
                                  <span
                                    key={
                                      level
                                    }
                                    className={`h-1 transition-all duration-300 ${
                                      passwordStrength.score >=
                                      level
                                        ? passwordStrength.score ===
                                          1
                                          ? "bg-[#985047]"
                                          : passwordStrength.score ===
                                              2
                                            ? "bg-[#9a7c49]"
                                            : "bg-[#536548]"
                                        : "bg-black/10"
                                    }`}
                                  />
                                )
                              )}
                            </div>

                            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                              <RequirementItem
                                met={
                                  requirements.length
                                }
                              >
                                At least 8
                                characters
                              </RequirementItem>

                              <RequirementItem
                                met={
                                  requirements.lowercase
                                }
                              >
                                One lowercase
                                letter
                              </RequirementItem>

                              <RequirementItem
                                met={
                                  requirements.uppercase
                                }
                              >
                                One uppercase
                                letter
                              </RequirementItem>

                              <RequirementItem
                                met={
                                  requirements.number
                                }
                              >
                                One number
                              </RequirementItem>
                            </ul>
                          </div>
                        ) : null}

                        <PasswordField
                          id="confirmPassword"
                          label="Confirm new password"
                          value={
                            confirmPassword
                          }
                          onChange={
                            handleConfirmPasswordChange
                          }
                          error={
                            confirmPasswordError
                          }
                          showPassword={
                            showConfirmPassword
                          }
                          onToggleVisibility={() =>
                            setShowConfirmPassword(
                              (current) =>
                                !current
                            )
                          }
                          autoComplete="new-password"
                          disabled={
                            isSubmitting
                          }
                          placeholder="Repeat your new password"
                        />

                        {generalError ? (
                          <div
                            role="alert"
                            className="border border-[#9d4d43]/20 bg-[#9d4d43]/[0.06] px-4 py-3.5 text-sm leading-6 text-[#7d3831]"
                          >
                            {
                              generalError
                            }
                          </div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={
                            isSubmitting
                          }
                          className="group relative flex h-14 w-full items-center justify-center overflow-hidden bg-[#141411] px-6 text-[0.68rem] font-semibold uppercase tracking-[0.27em] text-white transition duration-300 hover:bg-[#26231e] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <span className="relative z-10">
                            {isSubmitting
                              ? "Renewing access"
                              : "Update password"}
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
                    )}

                    <div className="mt-8 flex items-center justify-center">
                      <Link
                        href="/account/login"
                        className="text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-black/50 transition hover:text-black"
                      >
                        Return to sign in
                      </Link>
                    </div>
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
                      Password updated
                    </p>

                    <h2 className="mt-5 font-serif text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl">
                      Your access is

                      <span className="block italic text-[#7c6851]">
                        restored.
                      </span>
                    </h2>

                    <p className="mt-5 text-sm leading-7 text-black/58">
                      {successMessage}
                    </p>

                    <div className="mt-7 border border-black/[0.08] bg-[#f5f0e8] px-4 py-4">
                      <p className="text-xs leading-6 text-black/55">
                        For your security,
                        the reset link has
                        now been invalidated
                        and cannot be reused.
                      </p>
                    </div>

                    <Link
                      href="/account/login"
                      className="group relative mt-8 flex min-h-14 w-full items-center justify-center overflow-hidden bg-[#151512] px-6 text-[0.66rem] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#2a2722]"
                    >
                      <span className="relative z-10">
                        Sign in securely
                      </span>

                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/10 transition-all duration-700 group-hover:left-[115%]"
                      />
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-7 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-black/35">
                  Secure customer access
                </p>

                <p className="text-xs text-black/38">
                  ©{" "}
                  {new Date().getFullYear()}{" "}
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

function ResetPasswordFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3eee5] px-5 text-[#151515]">
      <div className="flex flex-col items-center">
        <span className="h-9 w-9 animate-spin rounded-full border border-black/15 border-t-black/70" />

        <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-black/40">
          Preparing secure access
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordFallback />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}