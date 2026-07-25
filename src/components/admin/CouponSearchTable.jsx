"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { adminAuthClient } from "../../lib/adminAuthClient";
import { normalizeAdminRoles } from "../../lib/adminPermissions";

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `৳ ${amount.toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCouponType(coupon) {
  const type = String(
    coupon.type ||
      coupon.discountType ||
      ""
  ).toLowerCase();

  if (
    type === "percentage" ||
    type === "percent"
  ) {
    return "percentage";
  }

  if (
    type === "fixed" ||
    type === "fixed_amount" ||
    type === "fixed-amount"
  ) {
    return "fixed";
  }

  if (
    type === "free_shipping" ||
    type === "free-shipping" ||
    type === "shipping" ||
    type === "free_delivery"
  ) {
    return "free_shipping";
  }

  return type || "unknown";
}

function getCouponTypeLabel(coupon) {
  const type = getCouponType(coupon);

  if (type === "percentage") {
    return "Percentage";
  }

  if (type === "fixed") {
    return "Fixed Amount";
  }

  if (type === "free_shipping") {
    return "Free Shipping";
  }

  return "Unknown";
}

function getDiscountText(coupon) {
  const type = getCouponType(coupon);

  const value = Number(
    coupon.value ??
      coupon.discountValue ??
      coupon.amount ??
      0
  );

  if (type === "percentage") {
    return `${value}%`;
  }

  if (type === "fixed") {
    return formatCurrency(value);
  }

  if (type === "free_shipping") {
    return "Free Delivery";
  }

  return "—";
}

function getCouponIsActive(coupon) {
  if (coupon.isActive === false) {
    return false;
  }

  if (coupon.active === false) {
    return false;
  }

  if (
    String(coupon.status || "")
      .trim()
      .toLowerCase() === "inactive"
  ) {
    return false;
  }

  return true;
}

function getCouponStartDate(coupon) {
  return (
    coupon.startsAt ??
    coupon.startDate ??
    null
  );
}

function getCouponExpiryDate(coupon) {
  return (
    coupon.expiresAt ??
    coupon.expiryDate ??
    null
  );
}

function getCouponStatus(coupon) {
  if (!getCouponIsActive(coupon)) {
    return "inactive";
  }

  const now = new Date();

  const startValue =
    getCouponStartDate(coupon);

  const expiryValue =
    getCouponExpiryDate(coupon);

  const startDate = startValue
    ? new Date(startValue)
    : null;

  const expiryDate = expiryValue
    ? new Date(expiryValue)
    : null;

  if (
    startDate &&
    !Number.isNaN(startDate.getTime()) &&
    startDate > now
  ) {
    return "scheduled";
  }

  if (
    expiryDate &&
    !Number.isNaN(expiryDate.getTime()) &&
    expiryDate < now
  ) {
    return "expired";
  }

  const usageLimit = Number(
    coupon.usageLimit
  );

  const usageCount = Number(
    coupon.usageCount || 0
  );

  if (
    Number.isFinite(usageLimit) &&
    usageLimit > 0 &&
    usageCount >= usageLimit
  ) {
    return "exhausted";
  }

  return "active";
}

function getStatusLabel(status) {
  if (status === "active") {
    return "Active";
  }

  if (status === "inactive") {
    return "Inactive";
  }

  if (status === "scheduled") {
    return "Scheduled";
  }

  if (status === "expired") {
    return "Expired";
  }

  if (status === "exhausted") {
    return "Usage Limit Reached";
  }

  return "Unknown";
}

function getStatusStyle(status) {
  if (status === "active") {
    return "border-green-500/40 bg-green-500/10 text-green-400";
  }

  if (status === "scheduled") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-400";
  }

  if (status === "expired") {
    return "border-orange-500/40 bg-orange-500/10 text-orange-400";
  }

  if (status === "exhausted") {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  }

  return "border-neutral-500/40 bg-neutral-500/10 text-neutral-400";
}

function getCouponIdentifier(coupon) {
  const identifier =
    coupon._id ||
    coupon.id ||
    coupon.code;

  if (
    identifier &&
    typeof identifier === "object" &&
    identifier.$oid
  ) {
    return identifier.$oid;
  }

  return identifier
    ? String(identifier)
    : "";
}

function getErrorMessage(
  data,
  fallback
) {
  if (
    data &&
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  return fallback;
}

function roleHasPermission(
  role,
  permissions
) {
  try {
    return (
      adminAuthClient.admin.checkRolePermission({
        role,
        permissions,
      }) === true
    );
  } catch {
    return false;
  }
}

function rolesHavePermission(
  roles,
  permissions
) {
  return roles.some((role) =>
    roleHasPermission(
      role,
      permissions
    )
  );
}

export default function CouponSearchTable({
  coupons = [],
}) {
  const router = useRouter();

  const {
    data: session,
    isPending: isSessionPending,
  } = adminAuthClient.useSession();

  const roles = useMemo(
    () =>
      normalizeAdminRoles(
        session?.user?.role
      ),
    [session?.user?.role]
  );

  const canUpdateCoupons = useMemo(
    () =>
      !isSessionPending &&
      rolesHavePermission(
        roles,
        {
          coupons: ["update"],
        }
      ),
    [
      roles,
      isSessionPending,
    ]
  );

  const canDeleteCoupons = useMemo(
    () =>
      !isSessionPending &&
      rolesHavePermission(
        roles,
        {
          coupons: ["delete"],
        }
      ),
    [
      roles,
      isSessionPending,
    ]
  );

  const [
    couponItems,
    setCouponItems,
  ] = useState(coupons);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  const [
    processingAction,
    setProcessingAction,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        setCouponItems(coupons);
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [coupons]);

  const filteredCoupons =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return couponItems.filter(
        (coupon) => {
          const status =
            getCouponStatus(coupon);

          const type =
            getCouponType(coupon);

          const code = String(
            coupon.code || ""
          ).toLowerCase();

          const name = String(
            coupon.name || ""
          ).toLowerCase();

          const description =
            String(
              coupon.description || ""
            ).toLowerCase();

          const matchesSearch =
            normalizedSearch.length ===
              0 ||
            code.includes(
              normalizedSearch
            ) ||
            name.includes(
              normalizedSearch
            ) ||
            description.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter === "all" ||
            status === statusFilter;

          const matchesType =
            typeFilter === "all" ||
            type === typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      couponItems,
      searchTerm,
      statusFilter,
      typeFilter,
    ]);

  const activeCount =
    couponItems.filter(
      (coupon) =>
        getCouponStatus(coupon) ===
        "active"
    ).length;

  const inactiveCount =
    couponItems.filter(
      (coupon) =>
        getCouponStatus(coupon) ===
        "inactive"
    ).length;

  const expiredCount =
    couponItems.filter(
      (coupon) =>
        getCouponStatus(coupon) ===
        "expired"
    ).length;

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  function showMessage(
    type,
    text
  ) {
    setMessage({
      type,
      text,
    });

    window.setTimeout(() => {
      setMessage(
        (currentMessage) => {
          if (
            currentMessage.type ===
              type &&
            currentMessage.text ===
              text
          ) {
            return {
              type: "",
              text: "",
            };
          }

          return currentMessage;
        }
      );
    }, 5000);
  }

  async function handleToggleCoupon(
    coupon
  ) {
    if (!canUpdateCoupons) {
      showMessage(
        "error",
        "You do not have permission to update coupons."
      );

      return;
    }

    const couponId =
      getCouponIdentifier(coupon);

    if (!couponId) {
      showMessage(
        "error",
        "Coupon identifier could not be found."
      );

      return;
    }

    const currentlyActive =
      getCouponIsActive(coupon);

    const nextActiveState =
      !currentlyActive;

    const actionKey =
      `toggle-${couponId}`;

    setProcessingAction(actionKey);

    setMessage({
      type: "",
      text: "",
    });

    try {
      const response = await fetch(
        `/api/coupons/${encodeURIComponent(
          couponId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isActive:
              nextActiveState,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to update coupon status."
          )
        );
      }

      const updatedCoupon =
        data.coupon || {
          ...coupon,
          active:
            nextActiveState,
          isActive:
            nextActiveState,
          status:
            nextActiveState
              ? "active"
              : "inactive",
        };

      setCouponItems(
        (currentCoupons) =>
          currentCoupons.map(
            (currentCoupon) => {
              const currentCouponId =
                getCouponIdentifier(
                  currentCoupon
                );

              if (
                String(
                  currentCouponId
                ) === String(couponId)
              ) {
                return {
                  ...currentCoupon,
                  ...updatedCoupon,
                };
              }

              return currentCoupon;
            }
          )
      );

      showMessage(
        "success",
        getErrorMessage(
          data,
          nextActiveState
            ? "Coupon activated successfully."
            : "Coupon deactivated successfully."
        )
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Coupon status update error:",
        error
      );

      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to update coupon status."
      );
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleDeleteCoupon(
    coupon
  ) {
    if (!canDeleteCoupons) {
      showMessage(
        "error",
        "You do not have permission to delete coupons."
      );

      return;
    }

    const couponId =
      getCouponIdentifier(coupon);

    if (!couponId) {
      showMessage(
        "error",
        "Coupon identifier could not be found."
      );

      return;
    }

    const couponCode =
      coupon.code ||
      "this coupon";

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${couponCode}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    const actionKey =
      `delete-${couponId}`;

    setProcessingAction(actionKey);

    setMessage({
      type: "",
      text: "",
    });

    try {
      const response = await fetch(
        `/api/coupons/${encodeURIComponent(
          couponId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to delete coupon."
          )
        );
      }

      setCouponItems(
        (currentCoupons) =>
          currentCoupons.filter(
            (currentCoupon) =>
              String(
                getCouponIdentifier(
                  currentCoupon
                )
              ) !== String(couponId)
          )
      );

      showMessage(
        "success",
        getErrorMessage(
          data,
          "Coupon deleted successfully."
        )
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Coupon delete error:",
        error
      );

      showMessage(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to delete coupon."
      );
    } finally {
      setProcessingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      {message.text ? (
        <div
          role="status"
          className={`border px-5 py-4 text-sm ${
            message.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-start justify-between gap-5">
            <p>{message.text}</p>

            <button
              type="button"
              onClick={() =>
                setMessage({
                  type: "",
                  text: "",
                })
              }
              className="shrink-0 text-xs uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Total Coupons
          </p>

          <p className="mt-4 font-heading text-4xl font-light text-[#f1ece4]">
            {couponItems.length}
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Active
          </p>

          <p className="mt-4 font-heading text-4xl font-light text-green-400">
            {activeCount}
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Inactive
          </p>

          <p className="mt-4 font-heading text-4xl font-light text-neutral-400">
            {inactiveCount}
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            Expired
          </p>

          <p className="mt-4 font-heading text-4xl font-light text-orange-400">
            {expiredCount}
          </p>
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.02] p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <input
            type="search"
            placeholder="Search coupons by code, name or description..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            className="w-full border border-white/10 bg-white/5 px-5 py-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="w-full border border-white/10 bg-[#111111] px-5 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
          >
            <option value="all">
              All Statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="exhausted">
              Usage Limit Reached
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="w-full border border-white/10 bg-[#111111] px-5 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
          >
            <option value="all">
              All Types
            </option>

            <option value="percentage">
              Percentage
            </option>

            <option value="fixed">
              Fixed Amount
            </option>

            <option value="free_shipping">
              Free Shipping
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="border border-white/15 px-6 py-4 text-xs uppercase tracking-[0.25em] text-neutral-400 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.25em] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing{" "}
          {filteredCoupons.length}{" "}
          of {couponItems.length}{" "}
          coupons
        </span>

        <span>
          Search and filters update instantly
        </span>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="border border-white/10 px-6 py-12 text-center">
          <p className="font-heading text-3xl font-light text-[#f1ece4]">
            No matching coupons
          </p>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-neutral-500">
            No coupon matches the current
            search and filter selection.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 border border-white/15 px-6 py-3 text-xs uppercase tracking-[0.25em] text-neutral-300 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <div className="min-w-[1450px]">
            <div className="grid grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr_0.9fr_1fr_1fr_1fr] border-b border-white/10 bg-white/5 px-6 py-4 text-xs uppercase tracking-[0.22em] text-neutral-500">
              <span>Coupon</span>
              <span>Type</span>
              <span>Discount</span>
              <span>Minimum</span>
              <span>Maximum</span>
              <span>Validity</span>
              <span>Usage</span>
              <span>Actions</span>
            </div>

            {filteredCoupons.map(
              (coupon) => {
                const couponId =
                  getCouponIdentifier(
                    coupon
                  );

                const status =
                  getCouponStatus(
                    coupon
                  );

                const isActive =
                  getCouponIsActive(
                    coupon
                  );

                const usageCount =
                  Number(
                    coupon.usageCount ||
                      0
                  );

                const usageLimit =
                  Number(
                    coupon.usageLimit ||
                      0
                  );

                const toggleActionKey =
                  `toggle-${couponId}`;

                const deleteActionKey =
                  `delete-${couponId}`;

                const isToggling =
                  processingAction ===
                  toggleActionKey;

                const isDeleting =
                  processingAction ===
                  deleteActionKey;

                const isProcessing =
                  Boolean(
                    processingAction
                  );

                return (
                  <div
                    key={couponId}
                    className="grid grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr_0.9fr_1fr_1fr_1fr] items-center border-b border-white/10 px-6 py-5 text-sm text-neutral-300 last:border-b-0"
                  >
                    <div className="pr-5">
                      <p className="font-medium tracking-[0.12em] text-[#f1ece4]">
                        {coupon.code ||
                          "No Code"}
                      </p>

                      {coupon.name ? (
                        <p className="mt-2 text-xs text-neutral-400">
                          {coupon.name}
                        </p>
                      ) : null}

                      <span
                        className={`mt-3 inline-flex border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${getStatusStyle(
                          status
                        )}`}
                      >
                        {getStatusLabel(
                          status
                        )}
                      </span>
                    </div>

                    <span>
                      {getCouponTypeLabel(
                        coupon
                      )}
                    </span>

                    <span className="text-[#f1ece4]">
                      {getDiscountText(
                        coupon
                      )}
                    </span>

                    <span>
                      {Number(
                        coupon.minimumOrder
                      ) > 0
                        ? formatCurrency(
                            coupon.minimumOrder
                          )
                        : "None"}
                    </span>

                    <span>
                      {Number(
                        coupon.maximumDiscount
                      ) > 0
                        ? formatCurrency(
                            coupon.maximumDiscount
                          )
                        : "None"}
                    </span>

                    <div className="space-y-2 text-xs">
                      <p>
                        <span className="text-neutral-600">
                          Start:
                        </span>{" "}
                        {formatDate(
                          getCouponStartDate(
                            coupon
                          )
                        )}
                      </p>

                      <p>
                        <span className="text-neutral-600">
                          End:
                        </span>{" "}
                        {formatDate(
                          getCouponExpiryDate(
                            coupon
                          )
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#f1ece4]">
                        {usageCount}
                        {usageLimit > 0
                          ? ` / ${usageLimit}`
                          : " / Unlimited"}
                      </p>

                      <p className="mt-2 text-xs text-neutral-500">
                        Times redeemed
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canUpdateCoupons ? (
                        <>
                          <Link
                            href={`/admin/coupons/${couponId}/edit`}
                            className={`border border-blue-500/70 px-3 py-2 text-xs text-blue-400 transition hover:bg-blue-500 hover:text-white ${
                              isProcessing
                                ? "pointer-events-none opacity-50"
                                : ""
                            }`}
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCoupon(
                                coupon
                              )
                            }
                            disabled={
                              isProcessing
                            }
                            className="border border-white/20 px-3 py-2 text-xs text-neutral-300 transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isToggling
                              ? "Updating..."
                              : isActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </>
                      ) : null}

                      {canDeleteCoupons ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCoupon(
                              coupon
                            )
                          }
                          disabled={
                            isProcessing
                          }
                          className="border border-red-500/50 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      ) : null}

                      {!isSessionPending &&
                      !canUpdateCoupons &&
                      !canDeleteCoupons ? (
                        <span className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                          Read Only
                        </span>
                      ) : null}

                      {isSessionPending ? (
                        <span className="border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                          Checking Access
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}