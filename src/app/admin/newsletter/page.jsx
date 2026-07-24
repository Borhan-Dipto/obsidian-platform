import Link from "next/link";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import clientPromise from "../../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const NEWSLETTER_COLLECTION =
  "newsletterSubscribers";

const ITEMS_PER_PAGE = 15;

const VALID_SUBSCRIBER_STATUSES = new Set([
  "active",
  "unsubscribed",
]);

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeStatus(value) {
  const status = normalizeText(
    value,
    "all"
  ).toLowerCase();

  if (
    status === "active" ||
    status === "unsubscribed"
  ) {
    return status;
  }

  return "all";
}

function normalizeSubscriberStatus(value) {
  const status = normalizeText(
    value,
    "active"
  ).toLowerCase();

  return VALID_SUBSCRIBER_STATUSES.has(status)
    ? status
    : "active";
}

function normalizePage(value) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSource(value) {
  const source = normalizeText(
    value,
    "footer"
  );

  return source
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getStatusClass(status) {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "unsubscribed") {
    return "border-neutral-500/20 bg-neutral-500/10 text-neutral-400";
  }

  return "border-white/10 bg-white/[0.04] text-neutral-400";
}

function buildNewsletterUrl({
  search = "",
  status = "all",
  page = 1,
}) {
  const parameters = new URLSearchParams();

  if (search) {
    parameters.set("search", search);
  }

  if (status !== "all") {
    parameters.set("status", status);
  }

  if (page > 1) {
    parameters.set("page", String(page));
  }

  const queryString = parameters.toString();

  return queryString
    ? `/admin/newsletter?${queryString}`
    : "/admin/newsletter";
}

function buildExportUrl({
  search = "",
  status = "all",
}) {
  const parameters = new URLSearchParams();

  if (search) {
    parameters.set("search", search);
  }

  if (status !== "all") {
    parameters.set("status", status);
  }

  const queryString = parameters.toString();

  return queryString
    ? `/api/admin/newsletter/export?${queryString}`
    : "/api/admin/newsletter/export";
}

function normalizeReturnUrl(value) {
  const fallbackUrl = "/admin/newsletter";

  const suppliedUrl = normalizeText(
    value,
    fallbackUrl
  );

  try {
    const parsedUrl = new URL(
      suppliedUrl,
      "http://localhost"
    );

    if (
      parsedUrl.pathname !==
      "/admin/newsletter"
    ) {
      return fallbackUrl;
    }

    parsedUrl.searchParams.delete("notice");
    parsedUrl.searchParams.delete("error");

    const queryString =
      parsedUrl.searchParams.toString();

    return queryString
      ? `${parsedUrl.pathname}?${queryString}`
      : parsedUrl.pathname;
  } catch {
    return fallbackUrl;
  }
}

function buildActionRedirectUrl(
  returnUrl,
  {
    notice = "",
    error = "",
  } = {}
) {
  const safeReturnUrl =
    normalizeReturnUrl(returnUrl);

  const parsedUrl = new URL(
    safeReturnUrl,
    "http://localhost"
  );

  parsedUrl.searchParams.delete("notice");
  parsedUrl.searchParams.delete("error");

  if (notice) {
    parsedUrl.searchParams.set(
      "notice",
      notice
    );
  }

  if (error) {
    parsedUrl.searchParams.set(
      "error",
      error
    );
  }

  const queryString =
    parsedUrl.searchParams.toString();

  return queryString
    ? `${parsedUrl.pathname}?${queryString}`
    : parsedUrl.pathname;
}

async function getNewsletterCollection() {
  const client = await clientPromise;

  const database = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  return database.collection(
    NEWSLETTER_COLLECTION
  );
}

async function getNewsletterData({
  search,
  status,
  page,
}) {
  try {
    const collection =
      await getNewsletterCollection();

    const query = {};

    if (search) {
      query.email = {
        $regex: escapeRegExp(search),
        $options: "i",
      };
    }

    if (status !== "all") {
      query.status = status;
    }

    const [
      subscribers,
      filteredCount,
      totalCount,
      activeCount,
      unsubscribedCount,
    ] = await Promise.all([
      collection
        .find(query)
        .sort({
          subscribedAt: -1,
          createdAt: -1,
        })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .toArray(),

      collection.countDocuments(query),

      collection.countDocuments({}),

      collection.countDocuments({
        status: "active",
      }),

      collection.countDocuments({
        status: "unsubscribed",
      }),
    ]);

    return {
      subscribers: subscribers.map(
        (subscriber) => ({
          ...subscriber,
          _id: subscriber._id.toString(),
        })
      ),

      filteredCount,
      totalCount,
      activeCount,
      unsubscribedCount,
      error: "",
    };
  } catch (error) {
    console.error(
      "Newsletter admin loading error:",
      error
    );

    return {
      subscribers: [],
      filteredCount: 0,
      totalCount: 0,
      activeCount: 0,
      unsubscribedCount: 0,
      error:
        "Newsletter subscribers could not be loaded.",
    };
  }
}

async function addSubscriber(formData) {
  "use server";

  await requireAdminPermission({
    newsletter: ["create"],
  });

  const email = normalizeEmail(
    formData.get("email")
  );

  const returnUrl = normalizeReturnUrl(
    formData.get("returnUrl")
  );

  if (
    !email ||
    email.length > 254 ||
    !isValidEmail(email)
  ) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: "invalid-email",
      })
    );
  }

  let notice = "added";
  let errorCode = "";
  let changed = false;

  try {
    const collection =
      await getNewsletterCollection();

    const existingSubscriber =
      await collection.findOne({
        email,
      });

    const now = new Date();

    if (existingSubscriber) {
      const existingStatus =
        normalizeSubscriberStatus(
          existingSubscriber.status
        );

      if (
        existingStatus === "unsubscribed"
      ) {
        await collection.updateOne(
          {
            _id: existingSubscriber._id,
          },
          {
            $set: {
              status: "active",
              source: "admin",
              resubscribedAt: now,
              updatedAt: now,
            },

            $unset: {
              unsubscribedAt: "",
            },
          }
        );

        notice = "reactivated";
        changed = true;
      } else {
        notice = "already-exists";
      }
    } else {
      await collection.insertOne({
        email,
        source: "admin",
        status: "active",
        subscribedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      notice = "added";
      changed = true;
    }
  } catch (error) {
    if (error?.code === 11000) {
      notice = "already-exists";
    } else {
      console.error(
        "Newsletter subscriber creation error:",
        error
      );

      errorCode = "add-failed";
    }
  }

  if (changed) {
    revalidatePath("/admin/newsletter");
  }

  if (errorCode) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: errorCode,
      })
    );
  }

  redirect(
    buildActionRedirectUrl(returnUrl, {
      notice,
    })
  );
}

async function updateSubscriberStatus(
  formData
) {
  "use server";

  await requireAdminPermission({
    newsletter: ["update"],
  });

  const subscriberId = normalizeText(
    formData.get("subscriberId")
  );

  const requestedStatus = normalizeText(
    formData.get("status")
  ).toLowerCase();

  const returnUrl = normalizeReturnUrl(
    formData.get("returnUrl")
  );

  if (
    !ObjectId.isValid(subscriberId) ||
    !VALID_SUBSCRIBER_STATUSES.has(
      requestedStatus
    )
  ) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: "invalid-subscriber",
      })
    );
  }

  let errorCode = "";

  try {
    const collection =
      await getNewsletterCollection();

    const now = new Date();

    const update =
      requestedStatus === "active"
        ? {
            $set: {
              status: "active",
              resubscribedAt: now,
              updatedAt: now,
            },

            $unset: {
              unsubscribedAt: "",
            },
          }
        : {
            $set: {
              status: "unsubscribed",
              unsubscribedAt: now,
              updatedAt: now,
            },
          };

    const result = await collection.updateOne(
      {
        _id: new ObjectId(subscriberId),
      },
      update
    );

    if (result.matchedCount === 0) {
      errorCode = "invalid-subscriber";
    } else {
      revalidatePath(
        "/admin/newsletter"
      );
    }
  } catch (error) {
    console.error(
      "Newsletter status update error:",
      error
    );

    errorCode = "update-failed";
  }

  if (errorCode) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: errorCode,
      })
    );
  }

  redirect(
    buildActionRedirectUrl(returnUrl, {
      notice:
        requestedStatus === "active"
          ? "status-active"
          : "status-unsubscribed",
    })
  );
}

async function deleteSubscriber(formData) {
  "use server";

  await requireAdminPermission({
    newsletter: ["delete"],
  });

  const subscriberId = normalizeText(
    formData.get("subscriberId")
  );

  const returnUrl = normalizeReturnUrl(
    formData.get("returnUrl")
  );

  if (!ObjectId.isValid(subscriberId)) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: "invalid-subscriber",
      })
    );
  }

  let errorCode = "";

  try {
    const collection =
      await getNewsletterCollection();

    const result = await collection.deleteOne({
      _id: new ObjectId(subscriberId),
    });

    if (result.deletedCount === 0) {
      errorCode = "invalid-subscriber";
    } else {
      revalidatePath(
        "/admin/newsletter"
      );
    }
  } catch (error) {
    console.error(
      "Newsletter subscriber deletion error:",
      error
    );

    errorCode = "delete-failed";
  }

  if (errorCode) {
    redirect(
      buildActionRedirectUrl(returnUrl, {
        error: errorCode,
      })
    );
  }

  redirect(
    buildActionRedirectUrl(returnUrl, {
      notice: "deleted",
    })
  );
}

function getNoticeMessage(code) {
  const messages = {
    added:
      "Subscriber added successfully.",

    reactivated:
      "The existing subscriber was reactivated successfully.",

    "already-exists":
      "This email address is already subscribed.",

    "status-active":
      "Subscriber status changed to active.",

    "status-unsubscribed":
      "Subscriber status changed to unsubscribed.",

    deleted:
      "Subscriber deleted successfully.",
  };

  return messages[code] || "";
}

function getErrorMessage(code) {
  const messages = {
    "invalid-email":
      "Enter a valid subscriber email address.",

    "add-failed":
      "The subscriber could not be added.",

    "invalid-subscriber":
      "The selected subscriber is invalid or no longer exists.",

    "update-failed":
      "The subscriber status could not be updated.",

    "delete-failed":
      "The subscriber could not be deleted.",
  };

  return messages[code] || "";
}

export default async function NewsletterAdminPage({
  searchParams,
}) {
  await requireAdminPermission({
    newsletter: ["read"],
  });

  const [
    canCreateSubscribers,
    canUpdateSubscribers,
    canDeleteSubscribers,
    canExportSubscribers,
  ] = await Promise.all([
    hasAdminPermission({
      newsletter: ["create"],
    }),

    hasAdminPermission({
      newsletter: ["update"],
    }),

    hasAdminPermission({
      newsletter: ["delete"],
    }),

    hasAdminPermission({
      newsletter: ["export"],
    }),
  ]);

  const resolvedSearchParams =
    await searchParams;

  const search = normalizeText(
    resolvedSearchParams?.search
  );

  const status = normalizeStatus(
    resolvedSearchParams?.status
  );

  const requestedPage = normalizePage(
    resolvedSearchParams?.page
  );

  const data = await getNewsletterData({
    search,
    status,
    page: requestedPage,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      data.filteredCount / ITEMS_PER_PAGE
    )
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  if (
    requestedPage > totalPages &&
    data.filteredCount > 0
  ) {
    redirect(
      buildNewsletterUrl({
        search,
        status,
        page: totalPages,
      })
    );
  }

  const firstVisibleItem =
    data.filteredCount === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    data.filteredCount
  );

  const currentUrl = buildNewsletterUrl({
    search,
    status,
    page: currentPage,
  });

  const exportUrl = buildExportUrl({
    search,
    status,
  });

  const noticeMessage =
    getNoticeMessage(
      normalizeText(
        resolvedSearchParams?.notice
      )
    );

  const actionError =
    getErrorMessage(
      normalizeText(
        resolvedSearchParams?.error
      )
    );

  const statistics = [
    {
      label: "Total Subscribers",
      value: data.totalCount,
      description:
        "All recorded subscribers",
    },
    {
      label: "Active",
      value: data.activeCount,
      description: "Currently subscribed",
    },
    {
      label: "Unsubscribed",
      value: data.unsubscribedCount,
      description:
        "Not receiving campaigns",
    },
    {
      label: "Filtered Results",
      value: data.filteredCount,
      description:
        "Current search results",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-8 border-b border-white/10 pb-10 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-neutral-600">
              Marketing
            </p>

            <h1 className="mt-4 font-heading text-5xl font-light sm:text-6xl lg:text-7xl">
              Newsletter
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
              Collect, add, filter, export, and
              manage customers who joined the
              OBSIDIAN mailing list.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canExportSubscribers ? (
              <a
                href={exportUrl}
                className="inline-flex items-center justify-center border border-white/15 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                Export CSV ↓
              </a>
            ) : null}

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white/15 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              View Store ↗
            </Link>
          </div>
        </header>

        {noticeMessage ? (
          <div
            role="status"
            className="mt-8 border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300"
          >
            {noticeMessage}
          </div>
        ) : null}

        {actionError || data.error ? (
          <div
            role="alert"
            className="mt-8 border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300"
          >
            {actionError || data.error}
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statistics.map((item) => (
            <article
              key={item.label}
              className="border border-white/10 bg-white/[0.015] p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
                {item.label}
              </p>

              <p className="mt-6 font-heading text-5xl font-light">
                {item.value}
              </p>

              <p className="mt-3 text-xs text-neutral-500">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 border border-white/10 bg-[#0b0b0b]">
          {canCreateSubscribers ? (
            <div className="border-b border-white/10 p-6 lg:p-8">
              <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] xl:items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-600">
                    Add Subscriber
                  </p>

                  <h2 className="mt-4 font-heading text-3xl font-light">
                    Manual subscription
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">
                    Add a customer manually. Existing
                    unsubscribed emails will be
                    reactivated instead of duplicated.
                  </p>
                </div>

                <form
                  action={addSubscriber}
                  className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <input
                    type="hidden"
                    name="returnUrl"
                    value={currentUrl}
                  />

                  <label className="block">
                    <span className="sr-only">
                      Subscriber email
                    </span>

                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="customer@example.com"
                      className="h-12 w-full border border-white/10 bg-[#080808] px-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                    />
                  </label>

                  <button
                    type="submit"
                    className="h-12 border border-[#f1ece4] bg-[#f1ece4] px-6 text-[10px] uppercase tracking-[0.28em] text-[#0b0b0b] transition hover:bg-transparent hover:text-[#f1ece4]"
                  >
                    Add Subscriber
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="border-b border-white/10 p-6 lg:p-8">
              <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-600">
                Read-only access
              </p>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
                You can review and filter newsletter subscribers. Manual
                subscription controls are hidden for this role.
              </p>
            </div>
          )}

          <div className="border-b border-white/10 p-5 sm:p-6">
            <form
              method="GET"
              action="/admin/newsletter"
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]"
            >
              <label className="block">
                <span className="sr-only">
                  Search subscribers
                </span>

                <input
                  type="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Search by email address"
                  className="h-12 w-full border border-white/10 bg-[#080808] px-4 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/30"
                />
              </label>

              <label className="block">
                <span className="sr-only">
                  Filter by status
                </span>

                <select
                  name="status"
                  defaultValue={status}
                  className="h-12 w-full border border-white/10 bg-[#080808] px-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="unsubscribed">
                    Unsubscribed
                  </option>
                </select>
              </label>

              <button
                type="submit"
                className="h-12 border border-[#f1ece4] bg-[#f1ece4] px-6 text-[10px] uppercase tracking-[0.28em] text-[#0b0b0b] transition hover:bg-transparent hover:text-[#f1ece4]"
              >
                Apply
              </button>

              <Link
                href="/admin/newsletter"
                className="flex h-12 items-center justify-center border border-white/10 px-6 text-[10px] uppercase tracking-[0.28em] text-neutral-400 transition hover:border-white/25 hover:text-white"
              >
                Reset
              </Link>
            </form>
          </div>

          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Showing {firstVisibleItem}–
              {lastVisibleItem} of{" "}
              {data.filteredCount}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <p>
                Page {currentPage} of{" "}
                {totalPages}
              </p>

              {canExportSubscribers ? (
                <a
                  href={exportUrl}
                  className="text-[10px] uppercase tracking-[0.24em] text-neutral-400 transition hover:text-white"
                >
                  Export these results
                </a>
              ) : null}
            </div>
          </div>

          {data.subscribers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="font-heading text-4xl font-light text-neutral-300">
                No subscribers found
              </p>

              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
                {canCreateSubscribers
                  ? "Add a subscriber manually or wait for customers to join through the storefront newsletter form."
                  : "No subscriber records match the current search and filter selection."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 text-[9px] font-normal uppercase tracking-[0.3em] text-neutral-600">
                        Email
                      </th>

                      <th className="px-6 py-4 text-[9px] font-normal uppercase tracking-[0.3em] text-neutral-600">
                        Status
                      </th>

                      <th className="px-6 py-4 text-[9px] font-normal uppercase tracking-[0.3em] text-neutral-600">
                        Source
                      </th>

                      <th className="px-6 py-4 text-[9px] font-normal uppercase tracking-[0.3em] text-neutral-600">
                        Subscribed
                      </th>

                      <th className="px-6 py-4 text-right text-[9px] font-normal uppercase tracking-[0.3em] text-neutral-600">
                        Manage
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.subscribers.map(
                      (subscriber) => {
                        const subscriberStatus =
                          normalizeSubscriberStatus(
                            subscriber.status
                          );

                        return (
                          <tr
                            key={subscriber._id}
                            className="border-b border-white/10 last:border-b-0"
                          >
                            <td className="px-6 py-5">
                              <p className="break-all text-sm text-neutral-200">
                                {subscriber.email}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex border px-3 py-2 text-[9px] uppercase tracking-[0.25em] ${getStatusClass(
                                  subscriberStatus
                                )}`}
                              >
                                {subscriberStatus}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-xs text-neutral-500">
                              {formatSource(
                                subscriber.source
                              )}
                            </td>

                            <td className="px-6 py-5 text-xs text-neutral-500">
                              {formatDate(
                                subscriber.subscribedAt ||
                                  subscriber.createdAt
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-3">
                                {canUpdateSubscribers ? (
                                  <form
                                    action={
                                      updateSubscriberStatus
                                    }
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="hidden"
                                      name="subscriberId"
                                      value={
                                        subscriber._id
                                      }
                                    />

                                    <input
                                      type="hidden"
                                      name="returnUrl"
                                      value={currentUrl}
                                    />

                                    <select
                                      name="status"
                                      defaultValue={
                                        subscriberStatus
                                      }
                                      aria-label={`Status for ${subscriber.email}`}
                                      className="h-10 border border-white/10 bg-[#080808] px-3 text-xs text-neutral-300 outline-none transition focus:border-white/30"
                                    >
                                      <option value="active">
                                        Active
                                      </option>

                                      <option value="unsubscribed">
                                        Unsubscribed
                                      </option>
                                    </select>

                                    <button
                                      type="submit"
                                      className="h-10 border border-white/15 px-4 text-[9px] uppercase tracking-[0.22em] text-neutral-300 transition hover:border-white/35 hover:text-white"
                                    >
                                      Update
                                    </button>
                                  </form>
                                ) : null}

                                {canDeleteSubscribers ? (
                                  <form
                                    action={
                                      deleteSubscriber
                                    }
                                  >
                                    <input
                                      type="hidden"
                                      name="subscriberId"
                                      value={
                                        subscriber._id
                                      }
                                    />

                                    <input
                                      type="hidden"
                                      name="returnUrl"
                                      value={currentUrl}
                                    />

                                    <button
                                      type="submit"
                                      className="h-10 border border-red-400/20 px-4 text-[9px] uppercase tracking-[0.22em] text-red-300 transition hover:bg-red-400/10"
                                    >
                                      Delete
                                    </button>
                                  </form>
                                ) : null}

                                {!canUpdateSubscribers &&
                                !canDeleteSubscribers ? (
                                  <span className="inline-flex h-10 items-center border border-white/10 px-4 text-[9px] uppercase tracking-[0.22em] text-neutral-600">
                                    Read Only
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-white/10 lg:hidden">
                {data.subscribers.map(
                  (subscriber) => {
                    const subscriberStatus =
                      normalizeSubscriberStatus(
                        subscriber.status
                      );

                    return (
                      <article
                        key={subscriber._id}
                        className="p-5 sm:p-6"
                      >
                        <p className="break-all text-sm text-neutral-200">
                          {subscriber.email}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex border px-3 py-2 text-[9px] uppercase tracking-[0.25em] ${getStatusClass(
                              subscriberStatus
                            )}`}
                          >
                            {subscriberStatus}
                          </span>

                          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                            {formatSource(
                              subscriber.source
                            )}
                          </span>
                        </div>

                        <p className="mt-4 text-xs text-neutral-500">
                          Subscribed{" "}
                          {formatDate(
                            subscriber.subscribedAt ||
                              subscriber.createdAt
                          )}
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          {canUpdateSubscribers ? (
                            <form
                              action={
                                updateSubscriberStatus
                              }
                              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                            >
                              <input
                                type="hidden"
                                name="subscriberId"
                                value={subscriber._id}
                              />

                              <input
                                type="hidden"
                                name="returnUrl"
                                value={currentUrl}
                              />

                              <select
                                name="status"
                                defaultValue={
                                  subscriberStatus
                                }
                                aria-label={`Status for ${subscriber.email}`}
                                className="h-11 w-full border border-white/10 bg-[#080808] px-3 text-xs text-neutral-300 outline-none transition focus:border-white/30"
                              >
                                <option value="active">
                                  Active
                                </option>

                                <option value="unsubscribed">
                                  Unsubscribed
                                </option>
                              </select>

                              <button
                                type="submit"
                                className="h-11 border border-white/15 px-4 text-[9px] uppercase tracking-[0.22em] text-neutral-300 transition hover:border-white/35 hover:text-white"
                              >
                                Update
                              </button>
                            </form>
                          ) : null}

                          {canDeleteSubscribers ? (
                            <form
                              action={
                                deleteSubscriber
                              }
                            >
                              <input
                                type="hidden"
                                name="subscriberId"
                                value={subscriber._id}
                              />

                              <input
                                type="hidden"
                                name="returnUrl"
                                value={currentUrl}
                              />

                              <button
                                type="submit"
                                className="h-11 w-full border border-red-400/20 px-4 text-[9px] uppercase tracking-[0.22em] text-red-300 transition hover:bg-red-400/10"
                              >
                                Delete
                              </button>
                            </form>
                          ) : null}

                          {!canUpdateSubscribers &&
                          !canDeleteSubscribers ? (
                            <span className="flex h-11 items-center justify-center border border-white/10 px-4 text-[9px] uppercase tracking-[0.22em] text-neutral-600">
                              Read Only
                            </span>
                          ) : null}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

          {totalPages > 1 ? (
            <nav
              aria-label="Newsletter pagination"
              className="flex flex-col gap-4 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildNewsletterUrl({
                    search,
                    status,
                    page: currentPage - 1,
                  })}
                  className="flex h-11 items-center justify-center border border-white/10 px-5 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:border-white/25 hover:text-white"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="flex h-11 cursor-not-allowed items-center justify-center border border-white/5 px-5 text-[10px] uppercase tracking-[0.25em] text-neutral-700">
                  ← Previous
                </span>
              )}

              <p className="text-center text-xs text-neutral-600">
                Page {currentPage} of{" "}
                {totalPages}
              </p>

              {currentPage < totalPages ? (
                <Link
                  href={buildNewsletterUrl({
                    search,
                    status,
                    page: currentPage + 1,
                  })}
                  className="flex h-11 items-center justify-center border border-white/10 px-5 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:border-white/25 hover:text-white"
                >
                  Next →
                </Link>
              ) : (
                <span className="flex h-11 cursor-not-allowed items-center justify-center border border-white/5 px-5 text-[10px] uppercase tracking-[0.25em] text-neutral-700">
                  Next →
                </span>
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}