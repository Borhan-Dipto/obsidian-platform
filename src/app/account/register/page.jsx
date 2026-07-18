"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const INITIAL_FORM_STATE = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
  marketingConsent: false,
};

function ArrowIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function EyeIcon({ visible }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
          <path d="M9.7 4.4A9.7 9.7 0 0 1 12 4.1c5.5 0 9 5.9 9 5.9a15 15 0 0 1-2.3 2.9" />
          <path d="M6.1 6.1C4 7.6 3 10 3 10s3.5 5.9 9 5.9c1.1 0 2.1-.2 3-.5" />
        </>
      ) : (
        <>
          <path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5.5" y="10" width="13" height="10" rx="1" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span className="absolute inset-0 animate-spin rounded-full border border-white/20 border-t-white" />
      <span className="h-1 w-1 rounded-full bg-white" />
    </span>
  );
}

function FieldError({ message, id }) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      className="mt-2.5 flex items-start gap-2 text-[11px] leading-5 text-[#94433b]"
    >
      <span className="mt-0.5 shrink-0">
        <ErrorIcon />
      </span>
      <span>{message}</span>
    </p>
  );
}

function LuxuryField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  error,
  onChange,
  required = false,
  maxLength,
}) {
  const hasValue = Boolean(value);

  return (
    <div className="auth-field group relative">
      <label
        htmlFor={name}
        className={`mb-3 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${
          error
            ? "text-[#94433b]"
            : "text-[#6d665e] group-focus-within:text-[#0b0b0b]"
        }`}
      >
        <span>{label}</span>

        {required && (
          <span
            aria-hidden="true"
            className="text-[#9c7b50]"
          >
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className="peer w-full appearance-none border-0 bg-transparent px-0 pb-[15px] pt-1 text-[15px] font-light tracking-[0.01em] text-[#0b0b0b] caret-[#0b0b0b] outline-none placeholder:text-[#9f988f]"
        />

        <span
          className={`absolute inset-x-0 bottom-0 h-px ${
            error ? "bg-[#94433b]" : "bg-[#bbb2a6]"
          }`}
        />

        <span
          className={`absolute bottom-0 left-0 h-px bg-[#0b0b0b] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            hasValue ? "w-[18%]" : "w-0"
          } peer-focus:w-full`}
        />
      </div>

      <FieldError
        id={`${name}-error`}
        message={error}
      />
    </div>
  );
}

function LuxuryPasswordField({
  label,
  name,
  value,
  placeholder,
  autoComplete,
  error,
  onChange,
  visible,
  onToggle,
}) {
  const hasValue = Boolean(value);

  return (
    <div className="auth-field group relative">
      <label
        htmlFor={name}
        className={`mb-3 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${
          error
            ? "text-[#94433b]"
            : "text-[#6d665e] group-focus-within:text-[#0b0b0b]"
        }`}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="text-[#9c7b50]"
        >
          *
        </span>
      </label>

      <div className="relative flex items-center">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={128}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className="peer min-w-0 flex-1 appearance-none border-0 bg-transparent px-0 pb-[15px] pt-1 text-[15px] font-light tracking-[0.04em] text-[#0b0b0b] caret-[#0b0b0b] outline-none placeholder:tracking-normal placeholder:text-[#9f988f]"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="mb-2 ml-4 flex h-9 w-9 shrink-0 items-center justify-center text-[#716a62] transition duration-300 hover:scale-105 hover:text-[#0b0b0b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0b0b0b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1ece4]"
        >
          <EyeIcon visible={visible} />
        </button>

        <span
          className={`absolute inset-x-0 bottom-0 h-px ${
            error ? "bg-[#94433b]" : "bg-[#bbb2a6]"
          }`}
        />

        <span
          className={`absolute bottom-0 left-0 h-px bg-[#0b0b0b] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            hasValue ? "w-[18%]" : "w-0"
          } peer-focus:w-full`}
        />
      </div>

      <FieldError
        id={`${name}-error`}
        message={error}
      />
    </div>
  );
}

function LuxuryCheckbox({
  checked,
  onChange,
  children,
  error,
}) {
  return (
    <div>
      <label className="group flex cursor-pointer items-start gap-4">
        <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="peer absolute inset-0 z-20 cursor-pointer opacity-0"
          />

          <span className="absolute inset-0 border border-[#9c9489] bg-transparent transition-all duration-300 group-hover:border-[#0b0b0b] peer-checked:border-[#0b0b0b] peer-checked:bg-[#0b0b0b] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0b0b0b]/20 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f1ece4]" />

          <span className="relative z-10 scale-75 text-[#f1ece4] opacity-0 transition-all duration-300 peer-checked:scale-100 peer-checked:opacity-100">
            <CheckIcon />
          </span>
        </span>

        <span className="text-[11px] font-light leading-[1.75] text-[#625c55] transition-colors duration-300 group-hover:text-[#282522]">
          {children}
        </span>
      </label>

      <FieldError
        id="acceptedTerms-error"
        message={error}
      />
    </div>
  );
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "Not entered",
      description: "Use 8+ characters",
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return {
      score,
      label: "Developing",
      description: "Add variety",
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Strong",
      description: "Well composed",
    };
  }

  return {
    score,
    label: "Exceptional",
    description: "Highly secure",
  };
}

function ObsidianStone() {
  return (
    <div className="absolute inset-x-0 top-[10%] h-[60%]">
      <div className="absolute left-[8%] top-[9%] h-[72%] w-[76%] rotate-[-7deg] border border-white/[0.035]" />

      <div className="auth-stone-wrap absolute left-[16%] top-[1%] h-[86%] w-[65%]">
        <div
          className="auth-stone relative h-full w-full overflow-hidden shadow-[0_80px_150px_rgba(0,0,0,0.92)]"
          style={{
            clipPath:
              "polygon(45% 0%, 76% 7%, 96% 30%, 91% 59%, 71% 87%, 45% 100%, 17% 79%, 3% 50%, 12% 18%)",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(128deg,#242424_0%,#101010_22%,#030303_52%,#131313_76%,#050505_100%)]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_31%_17%,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_70%_72%,rgba(255,255,255,0.05),transparent_28%)]" />

          <div className="absolute inset-y-[-20%] left-[28%] w-[18%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/[0.075] to-transparent blur-[2px]" />

          <div className="auth-stone-glint absolute inset-y-[-30%] left-[6%] w-[20%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent blur-lg" />

          <span className="absolute left-[19%] top-[-5%] h-[108%] w-px rotate-[10deg] bg-white/[0.075]" />
          <span className="absolute right-[26%] top-[2%] h-[88%] w-px rotate-[-16deg] bg-white/[0.052]" />
          <span className="absolute bottom-[28%] left-[5%] h-px w-[88%] rotate-[8deg] bg-white/[0.055]" />
          <span className="absolute bottom-[49%] left-[6%] h-px w-[72%] rotate-[-17deg] bg-white/[0.034]" />

          <span className="absolute bottom-[2%] left-[28%] h-[58%] w-[44%] rotate-[8deg] bg-[linear-gradient(145deg,transparent,rgba(255,255,255,0.025),rgba(0,0,0,0.35))]" />
        </div>
      </div>

      <div className="absolute left-[6%] top-[16%] h-px w-[34%] rotate-[8deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="absolute bottom-[5%] right-[-4%] h-px w-[72%] rotate-[11deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

function SuccessOverlay({ fullName }) {
  const firstName = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="auth-success fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#060606] px-6 text-[#f1ece4]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.07),transparent_30%),linear-gradient(150deg,#080808,#020202)]" />

      <div className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />

      <div className="absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />

      <div className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />

      <div className="relative z-10 max-w-3xl text-center">
        <div className="auth-success-check mx-auto mb-9 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 text-[#f1ece4]">
          <CheckIcon />
        </div>

        <p className="auth-success-copy mb-5 text-[9px] uppercase tracking-[0.43em] text-white/38">
          Membership established
        </p>

        <h2 className="auth-success-title font-heading text-[clamp(4rem,9vw,8rem)] font-light leading-[0.82] tracking-[-0.058em]">
          Welcome to
          <span className="block italic text-[#aaa198]">
            OBSIDIAN.
          </span>
        </h2>

        <p className="auth-success-copy mx-auto mt-8 max-w-md text-sm font-light leading-7 text-white/43">
          {firstName
            ? `${firstName}, your private profile is ready.`
            : "Your private profile is ready."}
        </p>

        <div className="auth-success-line mx-auto mt-10 h-px w-24 bg-white/24" />
      </div>
    </div>
  );
}

export default function CustomerRegistrationPage() {
  const router = useRouter();
  const formRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setGeneralError("");
  }

  function handleCheckboxChange(name) {
    return (event) => {
      setFormData((current) => ({
        ...current,
        [name]: event.target.checked,
      }));

      setFieldErrors((current) => ({
        ...current,
        [name]: "",
      }));

      setGeneralError("");
    };
  }

  function focusFirstError(errors) {
    const fieldOrder = [
      "fullName",
      "email",
      "password",
      "confirmPassword",
      "acceptedTerms",
    ];

    const firstErrorField = fieldOrder.find(
      (field) => errors[field]
    );

    if (!firstErrorField) {
      return;
    }

    window.requestAnimationFrame(() => {
      const target = formRef.current?.querySelector(
        `[name="${firstErrorField}"]`
      );

      if (target instanceof HTMLElement) {
        target.focus();
      }
    });
  }

  function validateForm() {
    const errors = {};
    const normalizedName = formData.fullName.trim();
    const normalizedEmail = formData.email.trim();

    if (!normalizedName) {
      errors.fullName = "Please enter your full name.";
    } else if (normalizedName.length < 2) {
      errors.fullName = "Please enter a valid full name.";
    }

    if (!normalizedEmail) {
      errors.email = "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Please create a password.";
    } else if (formData.password.length < 8) {
      errors.password =
        "Password must contain at least 8 characters.";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password =
        "Password must contain a lowercase letter.";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password =
        "Password must contain an uppercase letter.";
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password =
        "Password must contain at least one number.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.acceptedTerms) {
      errors.acceptedTerms =
        "You must accept the Terms and Privacy Policy.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          acceptedTerms: formData.acceptedTerms,
          marketingConsent: formData.marketingConsent,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        const errorMessage =
          data?.message ||
          "We could not create your account. Please try again.";

        if (data?.field) {
          const nextErrors = {
            [data.field]: errorMessage,
          };

          setFieldErrors((current) => ({
            ...current,
            ...nextErrors,
          }));

          focusFirstError(nextErrors);
        } else {
          setGeneralError(errorMessage);
        }

        setIsSubmitting(false);
        return;
      }

      setRegistrationComplete(true);

      window.setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 1900);
    } catch {
      setGeneralError(
        "A connection error occurred. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes authPanelEnter {
          from {
            opacity: 0;
            transform: scale(1.025);
            filter: blur(12px);
          }

          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes authReveal {
          from {
            opacity: 0;
            transform: translateY(28px);
            filter: blur(9px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes authStoneFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(-3.5deg);
          }

          50% {
            transform: translate3d(0, -12px, 0) rotate(-2.3deg);
          }
        }

        @keyframes authStoneGlint {
          0%,
          100% {
            opacity: 0.28;
            transform: translateX(-18%) rotate(12deg);
          }

          50% {
            opacity: 0.82;
            transform: translateX(22%) rotate(12deg);
          }
        }

        @keyframes authLine {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        @keyframes authSuccessEnter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes authSuccessScale {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes authSuccessLine {
          from {
            opacity: 0;
            transform: scaleX(0);
          }

          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        .auth-panel-enter {
          animation: authPanelEnter 1100ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .auth-reveal {
          animation: authReveal 900ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .auth-delay-1 {
          animation-delay: 100ms;
        }

        .auth-delay-2 {
          animation-delay: 200ms;
        }

        .auth-delay-3 {
          animation-delay: 300ms;
        }

        .auth-delay-4 {
          animation-delay: 400ms;
        }

        .auth-stone-wrap {
          animation: authStoneFloat 10s ease-in-out infinite;
        }

        .auth-stone-glint {
          animation: authStoneGlint 7.5s ease-in-out infinite;
        }

        .auth-line {
          transform-origin: left;
          animation: authLine 1200ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 450ms;
        }

        .auth-success {
          animation: authSuccessEnter 500ms ease both;
        }

        .auth-success-check,
        .auth-success-title,
        .auth-success-copy {
          animation: authSuccessScale 850ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .auth-success-title {
          animation-delay: 110ms;
        }

        .auth-success-copy {
          animation-delay: 210ms;
        }

        .auth-success-line {
          transform-origin: center;
          animation: authSuccessLine 950ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 360ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-panel-enter,
          .auth-reveal,
          .auth-stone-wrap,
          .auth-stone-glint,
          .auth-line,
          .auth-success,
          .auth-success-check,
          .auth-success-title,
          .auth-success-copy,
          .auth-success-line {
            animation: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {registrationComplete && (
        <SuccessOverlay fullName={formData.fullName} />
      )}

      <main className="min-h-screen overflow-hidden bg-[#f1ece4] text-[#0b0b0b]">
        <div className="grid min-h-screen lg:grid-cols-[0.94fr_1.06fr]">
          <section className="auth-panel-enter relative hidden min-h-screen overflow-hidden bg-[#050505] text-[#f1ece4] lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_26%,rgba(255,255,255,0.075),transparent_24%),radial-gradient(circle_at_20%_80%,rgba(177,132,74,0.04),transparent_22%),linear-gradient(145deg,#090909_0%,#020202_56%,#0b0b0b_100%)]" />

            <div className="absolute inset-0 opacity-[0.075] [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:96px_96px]" />

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />

            <div className="absolute -left-48 top-20 h-[34rem] w-[34rem] rounded-full border border-white/[0.04]" />
            <div className="absolute -left-16 top-40 h-[21rem] w-[21rem] rounded-full border border-white/[0.05]" />

            <ObsidianStone />

            <header className="relative z-10 flex items-center justify-between px-12 py-10 xl:px-16">
              <Link
                href="/"
                className="font-heading text-[21px] font-medium tracking-[0.35em] text-[#f1ece4] transition-opacity duration-300 hover:opacity-65"
              >
                OBSIDIAN
              </Link>

              <span className="text-[8px] uppercase tracking-[0.4em] text-white/27">
                Private Membership
              </span>
            </header>

            <div className="relative z-10 px-12 pb-14 xl:px-16 xl:pb-16">
              <div className="max-w-[35rem]">
                <span className="auth-line mb-8 block h-px w-14 bg-[#f1ece4]/32" />

                <p className="auth-reveal text-[9px] uppercase tracking-[0.43em] text-white/34">
                  The OBSIDIAN Circle
                </p>

                <h1 className="auth-reveal auth-delay-1 font-heading mt-5 text-[clamp(4.1rem,6vw,7.4rem)] font-light leading-[0.79] tracking-[-0.058em] text-[#f1ece4]">
                  Enter a world
                  <span className="block italic text-[#aaa198]">
                    shaped with
                  </span>
                  <span className="block italic text-[#d1c9be]">
                    intent.
                  </span>
                </h1>

                <p className="auth-reveal auth-delay-2 mt-8 max-w-md text-[13px] font-light leading-7 text-white/41">
                  A private profile for considered discovery,
                  curated releases and a more refined order
                  experience.
                </p>

                <div className="auth-reveal auth-delay-3 mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[8px] uppercase tracking-[0.32em] text-white/24">
                  <span>Early Access</span>
                  <span>Private Editions</span>
                  <span>Personal Archive</span>
                </div>
              </div>
            </div>
          </section>

          <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#f1ece4]">
            <div className="pointer-events-none absolute -right-48 -top-56 h-[40rem] w-[40rem] rounded-full border border-black/[0.032]" />
            <div className="pointer-events-none absolute -right-20 -top-28 h-[27rem] w-[27rem] rounded-full border border-black/[0.038]" />
            <div className="pointer-events-none absolute bottom-[-18rem] left-[-20rem] h-[35rem] w-[35rem] rounded-full border border-black/[0.024]" />

            <div className="pointer-events-none absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(11,11,11,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(11,11,11,0.16)_1px,transparent_1px)] [background-size:86px_86px]" />

            <header className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-10 lg:px-12 xl:px-16">
              <Link
                href="/"
                className="font-heading text-xl font-semibold tracking-[0.26em] lg:hidden"
              >
                OBSIDIAN
              </Link>

              <Link
                href="/"
                className="group ml-auto flex items-center gap-4 text-[9px] uppercase tracking-[0.3em] text-[#6c655d] transition-colors duration-300 hover:text-[#0b0b0b]"
              >
                <span>Return to store</span>
                <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </header>

            <div className="relative z-10 px-6 pb-4 lg:hidden sm:px-10">
              <div className="auth-reveal relative overflow-hidden border border-black/[0.08] bg-[#090909] px-6 py-8 text-[#f1ece4]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_35%)]" />

                <div className="relative z-10">
                  <p className="text-[8px] uppercase tracking-[0.38em] text-white/35">
                    Private Membership
                  </p>

                  <h1 className="font-heading mt-4 max-w-sm text-4xl font-light leading-[0.9] tracking-[-0.04em]">
                    Enter a world
                    <span className="block italic text-[#aaa198]">
                      shaped with intent.
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 items-center px-6 pb-14 pt-5 sm:px-10 lg:px-12 xl:px-16">
              <div className="mx-auto w-full max-w-[660px]">
                <div className="auth-reveal">
                  <p className="mb-5 text-[9px] font-medium uppercase tracking-[0.4em] text-[#736c64]">
                    Create an account
                  </p>

                  <h2 className="font-heading text-[clamp(3.7rem,6.4vw,6.7rem)] font-light leading-[0.82] tracking-[-0.058em]">
                    Your private
                    <span className="block italic text-[#817970]">
                      OBSIDIAN profile.
                    </span>
                  </h2>

                  <div className="mt-7 flex items-center gap-4">
                    <span className="h-px w-11 bg-[#0b0b0b]/28" />

                    <p className="text-[11px] font-light leading-6 text-[#68625b]">
                      Already part of OBSIDIAN?{" "}
                      <Link
                        href="/account/login"
                        className="border-b border-[#0b0b0b]/25 pb-0.5 text-[#0b0b0b] transition-colors duration-300 hover:border-[#0b0b0b]"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  noValidate
                  className="auth-reveal auth-delay-2 mt-11 space-y-8"
                >
                  <div className="grid gap-8 sm:grid-cols-2">
                    <LuxuryField
                      label="Full name"
                      name="fullName"
                      value={formData.fullName}
                      placeholder="Your full name"
                      autoComplete="name"
                      maxLength={80}
                      error={fieldErrors.fullName}
                      onChange={handleChange}
                      required
                    />

                    <LuxuryField
                      label="Email address"
                      name="email"
                      type="email"
                      value={formData.email}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      maxLength={254}
                      error={fieldErrors.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <LuxuryField
                    label="Phone number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    placeholder="Optional"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={30}
                    error={fieldErrors.phone}
                    onChange={handleChange}
                  />

                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <LuxuryPasswordField
                        label="Create password"
                        name="password"
                        value={formData.password}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        error={fieldErrors.password}
                        onChange={handleChange}
                        visible={showPassword}
                        onToggle={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                      />

                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex flex-1 gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <span
                              key={level}
                              className={`h-px flex-1 transition-colors duration-500 ${
                                passwordStrength.score >= level
                                  ? "bg-[#0b0b0b]"
                                  : "bg-[#d0c8bc]"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="text-right">
                          <span className="block whitespace-nowrap text-[8px] uppercase tracking-[0.23em] text-[#7e766d]">
                            {passwordStrength.label}
                          </span>

                          <span className="mt-1 block text-[9px] font-light text-[#9b9389]">
                            {passwordStrength.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    <LuxuryPasswordField
                      label="Confirm password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      error={fieldErrors.confirmPassword}
                      onChange={handleChange}
                      visible={showConfirmPassword}
                      onToggle={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                    />
                  </div>

                  <div className="space-y-5 border-y border-[#ccc3b7] py-7">
                    <LuxuryCheckbox
                      checked={formData.acceptedTerms}
                      onChange={handleCheckboxChange(
                        "acceptedTerms"
                      )}
                      error={fieldErrors.acceptedTerms}
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="border-b border-[#0b0b0b]/25 text-[#0b0b0b] transition-colors duration-300 hover:border-[#0b0b0b]"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="border-b border-[#0b0b0b]/25 text-[#0b0b0b] transition-colors duration-300 hover:border-[#0b0b0b]"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </LuxuryCheckbox>

                    <LuxuryCheckbox
                      checked={formData.marketingConsent}
                      onChange={handleCheckboxChange(
                        "marketingConsent"
                      )}
                    >
                      Receive private collection previews, editorial
                      stories and considered updates from OBSIDIAN.
                    </LuxuryCheckbox>
                  </div>

                  {generalError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 border border-[#94433b]/25 bg-[#94433b]/[0.035] px-5 py-4 text-[12px] font-light leading-6 text-[#813b34]"
                    >
                      <span className="mt-1 shrink-0">
                        <ErrorIcon />
                      </span>
                      <span>{generalError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex w-full items-center justify-between overflow-hidden border border-[#0b0b0b] bg-[#0b0b0b] px-7 py-[18px] text-[#f1ece4] transition-all duration-500 hover:border-[#191919] hover:bg-[#191919] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="absolute inset-0 -translate-x-[115%] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.12)_48%,transparent_75%)] transition-transform duration-1000 ease-out group-hover:translate-x-[115%]" />

                    <span className="relative z-10 text-[9px] font-medium uppercase tracking-[0.36em]">
                      {isSubmitting
                        ? "Establishing membership"
                        : "Create my account"}
                    </span>

                    <span className="relative z-10 flex h-5 w-5 items-center justify-center">
                      {isSubmitting ? (
                        <LoadingIcon />
                      ) : (
                        <ArrowIcon className="transition-transform duration-500 group-hover:translate-x-1.5" />
                      )}
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-3 pt-1 text-center text-[8px] uppercase tracking-[0.28em] text-[#847c73]">
                    <span className="h-px w-8 bg-[#bbb2a6]" />
                    <LockIcon />
                    <span>Secure private membership</span>
                    <span className="h-px w-8 bg-[#bbb2a6]" />
                  </div>
                </form>
              </div>
            </div>

            <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.065] px-6 py-5 text-[7px] uppercase tracking-[0.28em] text-[#888077] sm:px-10 lg:px-12 xl:px-16">
              <span>Built Under Pressure</span>
              <span>Finished With Precision</span>
            </footer>
          </section>
        </div>
      </main>
    </>
  );
}