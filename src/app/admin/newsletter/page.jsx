import Link from "next/link";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import clientPromise from "../../../lib/mongodb";
import { requireAdminAuth } from "../../../lib/adminAuth";

const NEWSLETTER_COLLECTION = "newsletterSubscribers";
const ITEMS_PER_PAGE = 15;

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeStatus(value) {
  const status = normalizeText(value, "all").toLowerCase();

  if (
    status === "active" ||
    status === "unsubscribed"
  ) {
    return status;
  }

  return "all";
}

function normalizePage(value) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function getNewsletterData({
  search,
  status,
  page,
}) {
  try {
    const client = await clientPromise;
    const database = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const collection = database.collection(
      NEWSLETTER_COLLECTION
    );

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
      subscribers: subscribers.map((subscriber) => ({
        ...subscriber,
        _id: subscriber._id.toString(),
      })),
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

async function deleteSubscriber(formData) {
  "use server";

  await requireAdminAuth();

  const subscriberId = normalizeText(
    formData.get("subscriberId")
  );

  const returnUrl = normalizeText(
    formData.get("returnUrl"),
    "/admin/newsletter"
  );

  if (!ObjectId.isValid(subscriberId)) {
    redirect(
      `${returnUrl}${
        returnUrl.includes("?") ? "&" : "?"
      }error=invalid-subscriber`
    );
  }

  try {
    const client = await clientPromise;
    const database = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    await database
      .collection(NEWSLETTER_COLLECTION)
      .deleteOne({
        _id: new ObjectId(subscriberId),
      });

    revalidatePath("/admin/newsletter");
  } catch (error) {
    console.error(
      "Newsletter subscriber deletion error:",
      error
    );

    redirect(
      `${returnUrl}${
        returnUrl.includes("?") ? "&" : "?"
      }error=delete-failed`
    );
  }

  redirect(
    `${returnUrl}${
      returnUrl.includes("?") ? "&" : "?"
    }deleted=true`
  );
}

export default async function NewsletterAdminPage({
  searchParams,
}) {
  await requireAdminAuth();

  const resolvedSearchParams = await searchParams;

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

  const wasDeleted =
    resolvedSearchParams?.deleted === "true";

  const actionError =
    resolvedSearchParams?.error ===
      "delete-failed"
      ? "Subscriber could not be deleted."
      : resolvedSearchParams?.error ===
          "invalid-subscriber"
        ? "The selected subscriber is invalid."
        : "";

  const statistics = [
    {
      label: "Total Subscribers",
      value: data.totalCount,
      description: "All recorded subscribers",
    },
    {
      label: "Active",
      value: data.activeCount,
      description: "Currently subscribed",
    },
    {
      label: "Unsubscribed",
      value: data.unsubscribedCount,
      description: "Inactive subscribers",
    },
    {
      label: "Filtered Results",
      value: data.filteredCount,
      description: "Current search results",
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
              Review and manage customers who joined
              the OBSIDIAN mailing list.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center justify-center border border-white/15 px-6 py-4 text-[10px] uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            View Store ↗
          </Link>
        </header>

        {wasDeleted ? (
          <div
            role="status"
            className="mt-8 border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300"
          >
            Subscriber deleted successfully.
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

            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {data.subscribers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="font-heading text-4xl font-light text-neutral-300">
                No subscribers found
              </p>

              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-500">
                New newsletter subscriptions will
                appear here automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[950px] border-collapse">
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
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.subscribers.map(
                      (subscriber) => {
                        const subscriberStatus =
                          normalizeText(
                            subscriber.status,
                            "active"
                          ).toLowerCase();

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

                            <td className="px-6 py-5 text-xs capitalize text-neutral-500">
                              {normalizeText(
                                subscriber.source,
                                "footer"
                              )}
                            </td>

                            <td className="px-6 py-5 text-xs text-neutral-500">
                              {formatDate(
                                subscriber.subscribedAt ||
                                  subscriber.createdAt
                              )}
                            </td>

                            <td className="px-6 py-5 text-right">
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
                                  className="border border-red-400/20 px-4 py-3 text-[9px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-400/10"
                                >
                                  Delete
                                </button>
                              </form>
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
                      normalizeText(
                        subscriber.status,
                        "active"
                      ).toLowerCase();

                    return (
                      <article
                        key={subscriber._id}
                        className="p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
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
                                {normalizeText(
                                  subscriber.source,
                                  "footer"
                                )}
                              </span>
                            </div>

                            <p className="mt-4 text-xs text-neutral-500">
                              {formatDate(
                                subscriber.subscribedAt ||
                                  subscriber.createdAt
                              )}
                            </p>
                          </div>

                          <form
                            action={deleteSubscriber}
                            className="shrink-0"
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
                              className="w-full border border-red-400/20 px-4 py-3 text-[9px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-400/10 sm:w-auto"
                            >
                              Delete
                            </button>
                          </form>
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
                Page {currentPage} of {totalPages}
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