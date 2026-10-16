"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const INITIAL_PROFILE_FORM = {
  fullName: "",
  email: "",
  phone: "",
};

const INITIAL_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function EyeIcon({
  visible,
  className = "h-5 w-5",
}) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.6 0 9 5 9 5s-1.2 1.8-3.3 3.2" />
        <path d="M6.2 6.2C4.2 7.5 3 9 3 9s3.4 5 9 5c.7 0 1.4-.1 2-.2" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12s3.4-5 9-5 9 5 9 5-3.4 5-9 5-9-5-9-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ArrowIcon({
  className = "h-4 w-4",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ProfileIcon({
  className = "h-5 w-5",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
    </svg>
  );
}

function LockIcon({
  className = "h-5 w-5",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="1"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function AddressIcon({
  className = "h-5 w-5",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function CheckIcon({
  className = "h-4 w-4",
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertMessage({
  type,
  message,
}) {
  if (!message) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 border px-4 py-4 text-sm leading-6 ${
        isSuccess
          ? "border-[#60745f]/25 bg-[#60745f]/10 text-[#334232]"
          : "border-[#9b554d]/25 bg-[#9b554d]/10 text-[#713b35]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          isSuccess
            ? "bg-[#536852] text-white"
            : "bg-[#8e4c45] text-white"
        }`}
      >
        {isSuccess ? (
          <CheckIcon className="h-3 w-3" />
        ) : (
          <span className="text-xs font-semibold">
            !
          </span>
        )}
      </span>

      <span>{message}</span>
    </div>
  );
}

function TextField({
  id,
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  disabled = false,
  readOnly = false,
  error = "",
  maxLength,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-black/48"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : undefined
        }
        className={`mt-3 min-h-14 w-full border bg-transparent px-4 text-sm text-[#171512] outline-none transition-all duration-300 placeholder:text-black/28 focus:border-black ${
          error
            ? "border-[#8e4c45]"
            : "border-black/15"
        } ${
          disabled || readOnly
            ? "cursor-not-allowed bg-black/[0.025] text-black/45"
            : "hover:border-black/30"
        }`}
      />

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs leading-5 text-[#8e4c45]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  error = "",
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-black/48"
      >
        {label}
      </label>

      <div className="relative mt-3">
        <input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : undefined
          }
          className={`min-h-14 w-full border bg-transparent px-4 pr-14 text-sm text-[#171512] outline-none transition-all duration-300 hover:border-black/30 focus:border-black ${
            error
              ? "border-[#8e4c45]"
              : "border-black/15"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-black/40 transition-colors hover:text-black"
        >
          <EyeIcon visible={visible} />
        </button>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs leading-5 text-[#8e4c45]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e9e3d8] px-5 text-[#171512]">
      <div className="text-center">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border border-black/15 border-t-black" />

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
          Loading your profile
        </p>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isSavingProfile,
    setIsSavingProfile,
  ] = useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] = useState(false);

  const [customer, setCustomer] =
    useState(null);

  const [
    profileForm,
    setProfileForm,
  ] = useState(INITIAL_PROFILE_FORM);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState(INITIAL_PASSWORD_FORM);

  const [
    profileErrors,
    setProfileErrors,
  ] = useState({});

  const [
    passwordErrors,
    setPasswordErrors,
  ] = useState({});

  const [
    profileMessage,
    setProfileMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    passwordVisibility,
    setPasswordVisibility,
  ] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const loadProfile = useCallback(
    async () => {
      try {
        const response = await fetch(
          "/api/account/profile",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.replace(
            "/account/login?redirect=/account/profile"
          );
          return;
        }

        if (!response.ok || !data?.customer) {
          setProfileMessage({
            type: "error",
            text:
              data?.message ||
              "We could not load your profile.",
          });
          return;
        }

        const loadedCustomer = data.customer;

        setCustomer(loadedCustomer);

        setProfileForm({
          fullName: normalizeText(
            loadedCustomer.fullName
          ),
          email: normalizeText(
            loadedCustomer.email
          ),
          phone: normalizeText(
            loadedCustomer.phone
          ),
        });
      } catch (error) {
        console.error(
          "Load Profile Error:",
          error
        );

        setProfileMessage({
          type: "error",
          text:
            "We could not load your profile. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        void loadProfile();
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [loadProfile]);

  function handleProfileChange(event) {
    const {
      name,
      value,
    } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setProfileMessage({
      type: "",
      text: "",
    });
  }

  function handlePasswordChange(event) {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setPasswordMessage({
      type: "",
      text: "",
    });
  }

  function togglePasswordVisibility(field) {
    setPasswordVisibility(
      (current) => ({
        ...current,
        [field]: !current[field],
      })
    );
  }

  function validateProfileForm() {
    const errors = {};

    const fullName = normalizeText(
      profileForm.fullName
    );

    const phone = normalizeText(
      profileForm.phone
    );

    if (!fullName) {
      errors.fullName =
        "Please enter your full name.";
    } else if (fullName.length < 2) {
      errors.fullName =
        "Please enter a valid full name.";
    }

    if (phone && phone.length < 6) {
      errors.phone =
        "Please enter a valid phone number.";
    }

    setProfileErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function validatePasswordForm() {
    const errors = {};

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (!currentPassword) {
      errors.currentPassword =
        "Please enter your current password.";
    }

    if (!newPassword) {
      errors.newPassword =
        "Please enter your new password.";
    } else if (newPassword.length < 8) {
      errors.newPassword =
        "Password must be at least 8 characters long.";
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain a lowercase letter.";
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain an uppercase letter.";
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword =
        "Password must contain a number.";
    }

    if (!confirmPassword) {
      errors.confirmPassword =
        "Please confirm your new password.";
    } else if (
      newPassword !== confirmPassword
    ) {
      errors.confirmPassword =
        "New passwords do not match.";
    }

    if (
      currentPassword &&
      newPassword &&
      currentPassword === newPassword
    ) {
      errors.newPassword =
        "Your new password must be different from your current password.";
    }

    setPasswordErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    setProfileMessage({
      type: "",
      text: "",
    });

    if (!validateProfileForm()) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const response = await fetch(
        "/api/account/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            fullName:
              profileForm.fullName,
            phone: profileForm.phone,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace(
          "/account/login?redirect=/account/profile"
        );
        return;
      }

      if (!response.ok) {
        if (data?.field) {
          setProfileErrors((current) => ({
            ...current,
            [data.field]:
              data.message ||
              "Please check this field.",
          }));
        }

        setProfileMessage({
          type: "error",
          text:
            data?.message ||
            "We could not update your profile.",
        });

        return;
      }

      if (data?.customer) {
        setCustomer(data.customer);

        setProfileForm({
          fullName: normalizeText(
            data.customer.fullName
          ),
          email: normalizeText(
            data.customer.email
          ),
          phone: normalizeText(
            data.customer.phone
          ),
        });
      }

      setProfileMessage({
        type: "success",
        text:
          data?.message ||
          "Your profile has been updated.",
      });

      router.refresh();
    } catch (error) {
      console.error(
        "Update Profile Error:",
        error
      );

      setProfileMessage({
        type: "error",
        text:
          "We could not update your profile. Please try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event
  ) {
    event.preventDefault();

    setPasswordMessage({
      type: "",
      text: "",
    });

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(
        "/api/account/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            passwordForm
          ),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        if (
          data?.field ===
          "currentPassword"
        ) {
          setPasswordErrors(
            (current) => ({
              ...current,
              currentPassword:
                data.message,
            })
          );

          setPasswordMessage({
            type: "error",
            text: data.message,
          });

          return;
        }

        router.replace(
          "/account/login?redirect=/account/profile"
        );
        return;
      }

      if (!response.ok) {
        if (data?.field) {
          setPasswordErrors(
            (current) => ({
              ...current,
              [data.field]:
                data.message ||
                "Please check this field.",
            })
          );
        }

        setPasswordMessage({
          type: "error",
          text:
            data?.message ||
            "We could not change your password.",
        });

        return;
      }

      setPasswordForm(
        INITIAL_PASSWORD_FORM
      );

      setPasswordVisibility({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });

      setPasswordMessage({
        type: "success",
        text:
          data?.message ||
          "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error(
        "Change Password Error:",
        error
      );

      setPasswordMessage({
        type: "error",
        text:
          "We could not change your password. Please try again.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  const customerName =
    normalizeText(customer?.fullName) ||
    "OBSIDIAN Member";

  const firstName =
    customerName.split(/\s+/)[0] ||
    "Member";

  const hasProfileChanges =
    normalizeText(profileForm.fullName) !==
      normalizeText(
        customer?.fullName
      ) ||
    normalizeText(profileForm.phone) !==
      normalizeText(customer?.phone);

  return (
    <main className="min-h-screen bg-[#e9e3d8] text-[#171512]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#151411] text-[#f5f0e7]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(211,195,164,0.17),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_48%)]" />

          <div className="absolute -right-48 -top-56 h-[42rem] w-[42rem] rounded-full border border-white/[0.045]" />

          <div className="absolute right-20 top-24 h-44 w-44 rotate-45 border border-[#d4c6a5]/[0.06]" />
        </div>

        <div className="relative mx-auto max-w-[1480px] px-5 pb-14 pt-6 sm:px-8 sm:pb-18 sm:pt-8 lg:px-12 xl:px-16">
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="Go to OBSIDIAN homepage"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-white/20 transition-colors duration-500 group-hover:border-white/45">
                <span className="h-3.5 w-3.5 rotate-45 border border-white/70 transition-transform duration-700 group-hover:rotate-[225deg]" />
              </span>

              <span className="text-sm font-semibold uppercase tracking-[0.34em]">
                OBSIDIAN
              </span>
            </Link>

            <Link
              href="/account"
              className="group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 transition-colors hover:text-white"
            >
              Account overview

              <ArrowIcon className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
          </header>

          <div className="grid gap-10 pb-2 pt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:pt-20">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#cdbf9e]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d6c9aa]">
                  Personal account
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl font-serif text-[3.5rem] font-medium leading-[0.9] tracking-[-0.055em] sm:text-[5rem] lg:text-[6.5rem]">
                Your profile,
                <span className="block italic text-[#d4c6a5]">
                  kept simple.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-7 text-white/52 sm:text-base sm:leading-8">
                Keep only the details needed
                for your account, communication
                and a smoother checkout.
              </p>
            </div>

            <div className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
                Signed in as
              </p>

              <p className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                {firstName}
              </p>

              <p className="mt-2 break-all text-xs leading-6 text-white/42">
                {profileForm.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav className="border-b border-black/10 bg-[#e2dacd]">
        <div className="mx-auto flex max-w-[1480px] gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12 xl:px-16">
          {[
            {
              label: "Overview",
              href: "/account",
            },
            {
              label: "Orders",
              href: "/account/orders",
            },
            {
              label: "Profile",
              href: "/account/profile",
            },
            {
              label: "Addresses",
              href: "/account/addresses",
            },
            {
              label: "Wishlist",
              href: "/wishlist",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                item.href ===
                "/account/profile"
                  ? "border-[#171512] bg-[#171512] text-white"
                  : "border-transparent text-black/45 hover:border-black/15 hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-12">
          <div className="space-y-8">
            <section className="border border-black/10 bg-[#f4f0e8]">
              <div className="flex items-start justify-between gap-6 border-b border-black/10 px-6 py-6 sm:px-8 sm:py-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/40">
                    Profile information
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                    Your details
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-black/48">
                    Only essential information
                    is collected for your
                    account and order
                    communication.
                  </p>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-black/10 text-black/55">
                  <ProfileIcon />
                </span>
              </div>

              <form
                onSubmit={handleProfileSubmit}
                className="px-6 py-7 sm:px-8 sm:py-9"
                noValidate
              >
                <AlertMessage
                  type={profileMessage.type}
                  message={profileMessage.text}
                />

                <div
                  className={
                    profileMessage.text
                      ? "mt-7 space-y-6"
                      : "space-y-6"
                  }
                >
                  <TextField
                    id="fullName"
                    label="Full name"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={
                      handleProfileChange
                    }
                    autoComplete="name"
                    placeholder="Enter your full name"
                    maxLength={80}
                    error={
                      profileErrors.fullName
                    }
                  />

                  <TextField
                    id="email"
                    label="Email address"
                    name="email"
                    value={profileForm.email}
                    onChange={() => {}}
                    type="email"
                    autoComplete="email"
                    readOnly
                  />

                  <p className="-mt-3 text-xs leading-6 text-black/38">
                    Your email is used to sign
                    in and cannot be changed
                    here.
                  </p>

                  <TextField
                    id="phone"
                    label="Phone number"
                    name="phone"
                    value={profileForm.phone}
                    onChange={
                      handleProfileChange
                    }
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    maxLength={30}
                    error={
                      profileErrors.phone
                    }
                  />
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-black/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-black/40">
                    Your details will be used
                    during checkout and order
                    communication.
                  </p>

                  <button
                    type="submit"
                    disabled={
                      isSavingProfile ||
                      !hasProfileChanges
                    }
                    className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-[#171512] px-6 text-[11px] font-semibold uppercase tracking-[0.23em] text-white transition-all duration-300 hover:bg-black/75 disabled:cursor-not-allowed disabled:bg-black/25"
                  >
                    {isSavingProfile
                      ? "Saving..."
                      : "Save changes"}

                    {!isSavingProfile ? (
                      <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    ) : null}
                  </button>
                </div>
              </form>
            </section>

            <section className="border border-black/10 bg-[#f4f0e8]">
              <div className="flex items-start justify-between gap-6 border-b border-black/10 px-6 py-6 sm:px-8 sm:py-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/40">
                    Account security
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                    Change password
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-black/48">
                    Use a strong password that
                    is different from your
                    current password.
                  </p>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-black/10 text-black/55">
                  <LockIcon />
                </span>
              </div>

              <form
                onSubmit={
                  handlePasswordSubmit
                }
                className="px-6 py-7 sm:px-8 sm:py-9"
                noValidate
              >
                <AlertMessage
                  type={
                    passwordMessage.type
                  }
                  message={
                    passwordMessage.text
                  }
                />

                <div
                  className={
                    passwordMessage.text
                      ? "mt-7 space-y-6"
                      : "space-y-6"
                  }
                >
                  <PasswordField
                    id="currentPassword"
                    label="Current password"
                    name="currentPassword"
                    value={
                      passwordForm.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    visible={
                      passwordVisibility.currentPassword
                    }
                    onToggle={() =>
                      togglePasswordVisibility(
                        "currentPassword"
                      )
                    }
                    autoComplete="current-password"
                    error={
                      passwordErrors.currentPassword
                    }
                  />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <PasswordField
                      id="newPassword"
                      label="New password"
                      name="newPassword"
                      value={
                        passwordForm.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      visible={
                        passwordVisibility.newPassword
                      }
                      onToggle={() =>
                        togglePasswordVisibility(
                          "newPassword"
                        )
                      }
                      autoComplete="new-password"
                      error={
                        passwordErrors.newPassword
                      }
                    />

                    <PasswordField
                      id="confirmPassword"
                      label="Confirm password"
                      name="confirmPassword"
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      visible={
                        passwordVisibility.confirmPassword
                      }
                      onToggle={() =>
                        togglePasswordVisibility(
                          "confirmPassword"
                        )
                      }
                      autoComplete="new-password"
                      error={
                        passwordErrors.confirmPassword
                      }
                    />
                  </div>
                </div>

                <div className="mt-7 border border-black/10 bg-black/[0.025] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                    Password requirements
                  </p>

                  <p className="mt-2 text-xs leading-6 text-black/45">
                    At least 8 characters,
                    including one uppercase
                    letter, one lowercase letter
                    and one number.
                  </p>
                </div>

                <div className="mt-8 flex justify-end border-t border-black/10 pt-7">
                  <button
                    type="submit"
                    disabled={
                      isChangingPassword
                    }
                    className="group inline-flex min-h-12 items-center justify-center gap-3 bg-[#171512] px-6 text-[11px] font-semibold uppercase tracking-[0.23em] text-white transition-all duration-300 hover:bg-black/75 disabled:cursor-not-allowed disabled:bg-black/35"
                  >
                    {isChangingPassword
                      ? "Updating..."
                      : "Update password"}

                    {!isChangingPassword ? (
                      <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    ) : null}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="relative overflow-hidden bg-[#171512] p-7 text-white sm:p-8">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/[0.05]" />

              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center border border-white/15 text-[#d4c6a5]">
                  <AddressIcon />
                </span>

                <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]">
                  Delivery addresses
                </p>

                <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.03em]">
                  Your address book
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/50">
                  Save home, office, gift or
                  other delivery addresses and
                  select them quickly during
                  checkout.
                </p>

                <Link
                  href="/account/addresses"
                  className="group mt-8 flex min-h-12 w-full items-center justify-center gap-3 border border-white/20 px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  Manage addresses

                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </section>

            <section className="border border-black/10 bg-[#dcd2c3] p-7 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.27em] text-black/40">
                Minimal by design
              </p>

              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.03em]">
                Only what matters.
              </h2>

              <div className="mt-7 space-y-4">
                {[
                  "Full name",
                  "Email address",
                  "Phone number",
                  "Saved delivery addresses",
                  "Secure password",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#171512] text-white">
                      <CheckIcon className="h-3 w-3" />
                    </span>

                    <span className="text-sm text-black/58">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <Link
              href="/account"
              className="group flex min-h-14 items-center justify-between border border-black/10 bg-transparent px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55 transition-all duration-300 hover:border-black hover:bg-[#171512] hover:text-white"
            >
              Back to account

              <ArrowIcon className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
          </aside>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#e2dacd]">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">
            OBSIDIAN private account
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/contact"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Assistance
            </Link>

            <Link
              href="/account/orders"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Orders
            </Link>

            <Link
              href="/shop"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}