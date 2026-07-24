import Link from "next/link";
import { requireAdminPermission } from "../../../../lib/adminAuth";
import {
  findAdminAuditLogs,
  getAdminAuditEventOptions,
  getAdminAuditSummary,
} from "../../../../lib/adminAuditQueries";

export const dynamic = "force-dynamic";

const STATUS_STYLES = {
  success:
    "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200",
  failure:
    "border-red-400/25 bg-red-400/[0.08] text-red-200",
  blocked:
    "border-amber-300/25 bg-amber-300/[0.08] text-amber-100",
  info:
    "border-sky-300/25 bg-sky-300/[0.08] text-sky-100",
};

const SEVERITY_STYLES = {
  info:
    "border-white/10 bg-white/[0.035] text-neutral-400",
  warning:
    "border-amber-300/20 bg-amber-300/[0.06] text-amber-200",
  critical:
    "border-red-400/30 bg-red-400/[0.1] text-red-200",
};

function normalizeText(value, maximumLength = 500) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function getSingleSearchValue(value) {
  if (Array.isArray(value)) {
    return normalizeText(value[0]);
  }

  return normalizeText(value);
}

function normalizePage(value) {
  const page = Number.parseInt(
    getSingleSearchValue(value),
    10
  );

  return Number.isFinite(page) && page > 0
    ? page
    : 1;
}

function humanizeEvent(value) {
  const event = normalizeText(value, 120);

  if (!event) {
    return "Unknown Event";
  }

  return event
    .replace(/[._:-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatDateTime(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const difference =
    timestamp - Date.now();

  const absoluteDifference =
    Math.abs(difference);

  const divisions = [
    {
      amount: 1000,
      unit: "second",
    },
    {
      amount: 60,
      unit: "minute",
    },
    {
      amount: 60,
      unit: "hour",
    },
    {
      amount: 24,
      unit: "day",
    },
  ];

  let valueAmount =
    difference / divisions[0].amount;

  let unit = divisions[0].unit;

  for (
    let index = 1;
    index < divisions.length;
    index += 1
  ) {
    const threshold =
      divisions
        .slice(0, index + 1)
        .reduce(
          (total, division) =>
            total * division.amount,
          1
        );

    if (
      absoluteDifference <
      threshold
    ) {
      break;
    }

    valueAmount /=
      divisions[index].amount;

    unit =
      divisions[index].unit;
  }

  const rounded =
    valueAmount < 0
      ? Math.ceil(valueAmount)
      : Math.floor(valueAmount);

  return new Intl.RelativeTimeFormat(
    "en",
    {
      numeric: "auto",
    }
  ).format(rounded, unit);
}

function formatMetadata(metadata) {
  if (
    metadata === null ||
    metadata === undefined
  ) {
    return "";
  }

  if (
    typeof metadata === "string"
  ) {
    return metadata;
  }

  try {
    return JSON.stringify(
      metadata,
      null,
      2
    );
  } catch {
    return "";
  }
}

function buildQueryString(
  currentFilters,
  overrides = {}
) {
  const values = {
    search:
      currentFilters.search,
    actor:
      currentFilters.actor,
    event:
      currentFilters.event,
    status:
      currentFilters.status,
    severity:
      currentFilters.severity,
    from:
      currentFilters.from,
    to:
      currentFilters.to,
    limit:
      currentFilters.limit,
    page:
      currentFilters.page,
    ...overrides,
  };

  const searchParams =
    new URLSearchParams();

  for (
    const [key, value] of
    Object.entries(values)
  ) {
    const normalizedValue =
      normalizeText(value);

    if (
      !normalizedValue ||
      (key === "page" &&
        normalizedValue === "1")
    ) {
      continue;
    }

    searchParams.set(
      key,
      normalizedValue
    );
  }

  const queryString =
    searchParams.toString();

  return queryString
    ? `/admin/security/audit-logs?${queryString}`
    : "/admin/security/audit-logs";
}

function SummaryCard({
  eyebrow,
  value,
  description,
  tone = "neutral",
}) {
  const toneClass =
    tone === "critical"
      ? "text-red-200"
      : tone === "warning"
        ? "text-amber-200"
        : tone === "success"
          ? "text-emerald-200"
          : "text-[#f1ece4]";

  return (
    <article className="border border-white/10 bg-[#0c0c0c] p-6">
      <p className="text-[9px] uppercase tracking-[0.34em] text-neutral-600">
        {eyebrow}
      </p>

      <p
        className={`mt-5 font-heading text-4xl font-light ${toneClass}`}
      >
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-neutral-600">
        {description}
      </p>
    </article>
  );
}

function AuditBadge({
  children,
  className,
}) {
  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-[9px] uppercase tracking-[0.22em] ${className}`}
    >
      {children}
    </span>
  );
}

function FilterField({
  label,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      <label className="mb-3 block text-[9px] uppercase tracking-[0.3em] text-neutral-600">
        {label}
      </label>

      {children}
    </div>
  );
}

export default async function AdminAuditLogsPage({
  searchParams,
}) {
  await requireAdminPermission({
    security: ["read_audit"],
  });

  const resolvedSearchParams =
    await searchParams;

  const currentFilters = {
    page: normalizePage(
      resolvedSearchParams?.page
    ),

    limit:
      getSingleSearchValue(
        resolvedSearchParams?.limit
      ) || "25",

    search:
      getSingleSearchValue(
        resolvedSearchParams?.search
      ),

    actor:
      getSingleSearchValue(
        resolvedSearchParams?.actor
      ),

    event:
      getSingleSearchValue(
        resolvedSearchParams?.event
      ),

    status:
      getSingleSearchValue(
        resolvedSearchParams?.status
      ),

    severity:
      getSingleSearchValue(
        resolvedSearchParams?.severity
      ),

    from:
      getSingleSearchValue(
        resolvedSearchParams?.from
      ),

    to:
      getSingleSearchValue(
        resolvedSearchParams?.to
      ),
  };

  const [
    auditResult,
    summary,
    eventOptions,
  ] = await Promise.all([
    findAdminAuditLogs(
      currentFilters
    ),

    getAdminAuditSummary(),

    getAdminAuditEventOptions(),
  ]);

  const hasActiveFilters =
    Boolean(
      currentFilters.search ||
        currentFilters.actor ||
        currentFilters.event ||
        currentFilters.status ||
        currentFilters.severity ||
        currentFilters.from ||
        currentFilters.to
    );

  const {
    page,
    totalPages,
    totalItems,
    hasPreviousPage,
    hasNextPage,
  } = auditResult.pagination;

  const firstItemNumber =
    totalItems === 0
      ? 0
      : (page - 1) *
          auditResult.pagination
            .limit +
        1;

  const lastItemNumber =
    Math.min(
      page *
        auditResult.pagination
          .limit,
      totalItems
    );

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <section className="border-b border-white/10 pb-9">
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-neutral-600">
              Administration / Security
            </p>

            <h1 className="font-heading mt-5 text-5xl font-light sm:text-6xl">
              Audit Logs
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500">
              Review privileged
              authentication, verification,
              session and administrative
              security activity recorded by
              the OBSIDIAN platform.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/security/audit-logs"
              className="inline-flex items-center justify-center border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400 transition hover:bg-white/5 hover:text-white"
            >
              Refresh Logs
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center bg-[#f1ece4] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#080808] transition hover:bg-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          eyebrow="Total Events"
          value={summary.totalEvents}
          description="All retained security events."
        />

        <SummaryCard
          eyebrow="Last 24 Hours"
          value={
            summary.eventsLast24Hours
          }
          description="Recent recorded activity."
          tone="success"
        />

        <SummaryCard
          eyebrow="Failures / 7 Days"
          value={
            summary.failuresLast7Days
          }
          description="Unsuccessful security actions."
          tone={
            summary.failuresLast7Days >
            0
              ? "warning"
              : "neutral"
          }
        />

        <SummaryCard
          eyebrow="Blocked / Critical"
          value={`${summary.blockedLast7Days} / ${summary.criticalLast7Days}`}
          description="Blocked and critical events in seven days."
          tone={
            summary.blockedLast7Days >
              0 ||
            summary.criticalLast7Days >
              0
              ? "critical"
              : "neutral"
          }
        />
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <article className="border border-white/10 bg-[#0c0c0c] p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-600">
            Unique Administrators / 7 Days
          </p>

          <p className="mt-4 font-heading text-3xl font-light">
            {
              summary.uniqueActorsLast7Days
            }
          </p>
        </article>

        <article className="border border-white/10 bg-[#0c0c0c] p-5">
          <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-600">
            Latest Security Event
          </p>

          <p className="mt-4 text-sm text-neutral-300">
            {summary.latestEventAt
              ? formatDateTime(
                  summary.latestEventAt
                )
              : "No events recorded"}
          </p>

          {summary.latestEventAt ? (
            <p className="mt-2 text-xs text-neutral-600">
              {formatRelativeTime(
                summary.latestEventAt
              )}
            </p>
          ) : null}
        </article>
      </section>

      <section className="mt-8 border border-white/10 bg-[#0c0c0c] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[9px] uppercase tracking-[0.34em] text-neutral-600">
              Search & Filter
            </p>

            <h2 className="font-heading mt-3 text-3xl font-light">
              Security Activity
            </h2>
          </div>

          {hasActiveFilters ? (
            <Link
              href="/admin/security/audit-logs"
              className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-white"
            >
              Clear All Filters
            </Link>
          ) : null}
        </div>

        <form
          method="get"
          action="/admin/security/audit-logs"
          className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          <FilterField
            label="Search Logs"
            className="md:col-span-2"
          >
            <input
              type="search"
              name="search"
              defaultValue={
                currentFilters.search
              }
              maxLength={120}
              placeholder="Event, message, path or target"
              className="w-full border border-white/10 bg-white/[0.035] px-4 py-4 text-sm outline-none transition placeholder:text-neutral-700 focus:border-white/30"
            />
          </FilterField>

          <FilterField label="Administrator">
            <input
              type="search"
              name="actor"
              defaultValue={
                currentFilters.actor
              }
              maxLength={120}
              placeholder="Name, email or ID"
              className="w-full border border-white/10 bg-white/[0.035] px-4 py-4 text-sm outline-none transition placeholder:text-neutral-700 focus:border-white/30"
            />
          </FilterField>

          <FilterField label="Event">
            <select
              name="event"
              defaultValue={
                currentFilters.event
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            >
              <option value="">
                All Events
              </option>

              {eventOptions.map(
                (event) => (
                  <option
                    key={event}
                    value={event}
                  >
                    {humanizeEvent(
                      event
                    )}
                  </option>
                )
              )}
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              name="status"
              defaultValue={
                currentFilters.status
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            >
              <option value="">
                All Statuses
              </option>
              <option value="success">
                Success
              </option>
              <option value="failure">
                Failure
              </option>
              <option value="blocked">
                Blocked
              </option>
              <option value="info">
                Information
              </option>
            </select>
          </FilterField>

          <FilterField label="Severity">
            <select
              name="severity"
              defaultValue={
                currentFilters.severity
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            >
              <option value="">
                All Severities
              </option>
              <option value="info">
                Information
              </option>
              <option value="warning">
                Warning
              </option>
              <option value="critical">
                Critical
              </option>
            </select>
          </FilterField>

          <FilterField label="From Date">
            <input
              type="date"
              name="from"
              defaultValue={
                currentFilters.from
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            />
          </FilterField>

          <FilterField label="To Date">
            <input
              type="date"
              name="to"
              defaultValue={
                currentFilters.to
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            />
          </FilterField>

          <FilterField label="Rows Per Page">
            <select
              name="limit"
              defaultValue={
                currentFilters.limit
              }
              className="w-full border border-white/10 bg-[#111111] px-4 py-4 text-sm text-neutral-300 outline-none transition focus:border-white/30"
            >
              <option value="10">
                10 rows
              </option>
              <option value="25">
                25 rows
              </option>
              <option value="50">
                50 rows
              </option>
              <option value="100">
                100 rows
              </option>
            </select>
          </FilterField>

          <div className="flex items-end md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              className="w-full bg-[#f1ece4] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#080808] transition hover:bg-white sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[9px] uppercase tracking-[0.34em] text-neutral-600">
              Recorded Events
            </p>

            <h2 className="font-heading mt-3 text-3xl font-light">
              Activity Timeline
            </h2>
          </div>

          <p className="text-xs text-neutral-600">
            {totalItems === 0
              ? "No matching records"
              : `Showing ${firstItemNumber}–${lastItemNumber} of ${totalItems}`}
          </p>
        </div>

        {auditResult.items.length ===
        0 ? (
          <div className="mt-5 border border-dashed border-white/15 bg-[#0c0c0c] px-6 py-16 text-center">
            <p className="font-heading text-3xl font-light text-neutral-400">
              No Audit Events
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600">
              No security events match
              the current filters. New
              authentication and session
              activity will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {auditResult.items.map(
              (log) => {
                const metadata =
                  formatMetadata(
                    log.metadata
                  );

                const actorLabel =
                  log.actor.name ||
                  log.actor.email ||
                  log.actor.userId ||
                  "Unresolved Actor";

                return (
                  <article
                    key={log.id}
                    className="border border-white/10 bg-[#0c0c0c]"
                  >
                    <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <AuditBadge
                            className={
                              STATUS_STYLES[
                                log.status
                              ] ||
                              STATUS_STYLES.info
                            }
                          >
                            {log.status}
                          </AuditBadge>

                          <AuditBadge
                            className={
                              SEVERITY_STYLES[
                                log.severity
                              ] ||
                              SEVERITY_STYLES.info
                            }
                          >
                            {log.severity}
                          </AuditBadge>
                        </div>

                        <p className="mt-5 break-words text-[10px] uppercase tracking-[0.28em] text-neutral-600">
                          {log.event}
                        </p>

                        <h3 className="mt-3 text-lg font-medium leading-7 text-neutral-200">
                          {humanizeEvent(
                            log.event
                          )}
                        </h3>

                        {log.message ? (
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
                            {log.message}
                          </p>
                        ) : null}

                        <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <dt className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                              Administrator
                            </dt>

                            <dd className="mt-2 break-words text-xs leading-5 text-neutral-400">
                              {actorLabel}
                            </dd>

                            {log.actor.email &&
                            log.actor.email !==
                              actorLabel ? (
                              <dd className="mt-1 break-all text-[11px] text-neutral-600">
                                {
                                  log.actor
                                    .email
                                }
                              </dd>
                            ) : null}
                          </div>

                          <div>
                            <dt className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                              Endpoint
                            </dt>

                            <dd className="mt-2 break-all font-mono text-[11px] leading-5 text-neutral-500">
                              {log.request
                                .method
                                ? `${log.request.method} `
                                : ""}
                              {log.request
                                .path ||
                                "Unavailable"}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                              Network
                            </dt>

                            <dd className="mt-2 text-xs text-neutral-500">
                              {log.request
                                .ipAddress ||
                                "Unavailable"}
                            </dd>
                          </div>
                        </dl>

                        {metadata ? (
                          <details className="mt-6 border border-white/10 bg-black/20">
                            <summary className="cursor-pointer px-4 py-4 text-[10px] uppercase tracking-[0.25em] text-neutral-500 transition hover:text-white">
                              View Sanitized Metadata
                            </summary>

                            <pre className="max-h-80 overflow-auto border-t border-white/10 p-4 text-[11px] leading-6 text-neutral-500">
                              {metadata}
                            </pre>
                          </details>
                        ) : null}
                      </div>

                      <aside className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                        <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                          Occurred At
                        </p>

                        <p className="mt-3 text-sm leading-6 text-neutral-300">
                          {formatDateTime(
                            log.occurredAt
                          )}
                        </p>

                        <p className="mt-2 text-xs text-neutral-600">
                          {formatRelativeTime(
                            log.occurredAt
                          )}
                        </p>

                        {log.actor.roles
                          .length > 0 ? (
                          <div className="mt-6">
                            <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                              Roles
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {log.actor.roles.map(
                                (role) => (
                                  <span
                                    key={role}
                                    className="border border-white/10 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.2em] text-neutral-500"
                                  >
                                    {role}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}

                        {log.target.type ||
                        log.target.id ||
                        log.target.label ? (
                          <div className="mt-6">
                            <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                              Target
                            </p>

                            <p className="mt-3 break-words text-xs leading-5 text-neutral-500">
                              {[
                                log.target
                                  .type,
                                log.target
                                  .label,
                                log.target.id,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(" / ")}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-6">
                          <p className="text-[9px] uppercase tracking-[0.28em] text-neutral-700">
                            Request ID
                          </p>

                          <p className="mt-3 break-all font-mono text-[10px] leading-5 text-neutral-600">
                            {log.request
                              .requestId ||
                              "Unavailable"}
                          </p>
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Audit log pagination"
            className="mt-7 flex flex-col justify-between gap-4 border border-white/10 bg-[#0c0c0c] p-4 sm:flex-row sm:items-center"
          >
            <p className="text-xs text-neutral-600">
              Page {page} of{" "}
              {totalPages}
            </p>

            <div className="flex gap-3">
              {hasPreviousPage ? (
                <Link
                  href={buildQueryString(
                    currentFilters,
                    {
                      page:
                        page - 1,
                    }
                  )}
                  className="inline-flex border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-neutral-400 transition hover:bg-white/5 hover:text-white"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed border border-white/5 px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-neutral-800">
                  ← Previous
                </span>
              )}

              {hasNextPage ? (
                <Link
                  href={buildQueryString(
                    currentFilters,
                    {
                      page:
                        page + 1,
                    }
                  )}
                  className="inline-flex bg-[#f1ece4] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#080808] transition hover:bg-white"
                >
                  Next →
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed bg-white/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-neutral-700">
                  Next →
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}