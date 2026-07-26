import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "../layout/Footer";
import Navbar from "../layout/Navbar";

import {
  getCmsContent,
} from "../../lib/getCmsContent";

import {
  DEFAULT_SETTINGS,
  getSettings,
} from "../../lib/settings";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
    ?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

function normalizeText(
  value,
  fallback = ""
) {
  const normalizedValue =
    String(value ?? "")
      .normalize("NFKC")
      .trim();

  return (
    normalizedValue ||
    fallback
  );
}

function normalizeOrder(
  value,
  fallback = 0
) {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
}

function formatPolicyDate(value) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function replaceTemplateValues(
  value,
  templateValues
) {
  let output =
    normalizeText(value);

  for (
    const [
      key,
      replacement,
    ]
    of Object.entries(
      templateValues
    )
  ) {
    output = output.replaceAll(
      `{{${key}}}`,
      normalizeText(
        replacement
      )
    );
  }

  return output;
}

function getAbsoluteUrl(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return SITE_URL;
  }

  if (
    normalizedValue.startsWith(
      "https://"
    ) ||
    normalizedValue.startsWith(
      "http://"
    )
  ) {
    return normalizedValue;
  }

  return `${SITE_URL}${
    normalizedValue.startsWith(
      "/"
    )
      ? normalizedValue
      : `/${normalizedValue}`
  }`;
}

function serializeJsonLd(value) {
  return JSON.stringify(
    value
  ).replace(
    /</g,
    "\\u003c"
  );
}

function getVisibleSections(
  sections
) {
  if (
    !Array.isArray(sections)
  ) {
    return [];
  }

  return [...sections]
    .filter(
      (section) =>
        section &&
        section.isActive !==
          false &&
        normalizeText(
          section.title
        )
    )
    .sort(
      (
        firstSection,
        secondSection
      ) =>
        normalizeOrder(
          firstSection.order
        ) -
        normalizeOrder(
          secondSection.order
        )
    );
}

function getVisibleRelatedPolicies(
  policies
) {
  if (
    !Array.isArray(policies)
  ) {
    return [];
  }

  return [...policies]
    .filter(
      (policy) =>
        policy &&
        policy.isActive !==
          false &&
        normalizeText(
          policy.label
        ) &&
        normalizeText(
          policy.href
        ).startsWith("/")
    )
    .sort(
      (
        firstPolicy,
        secondPolicy
      ) =>
        normalizeOrder(
          firstPolicy.order
        ) -
        normalizeOrder(
          secondPolicy.order
        )
    );
}

async function getLegalPageData(
  policyKey
) {
  const [
    policy,
    settings,
  ] = await Promise.all([
    getCmsContent(policyKey),

    getSettings().catch(
      (error) => {
        console.error(
          "Legal policy settings loading error:",
          error
        );

        return DEFAULT_SETTINGS;
      }
    ),
  ]);

  return {
    policy,
    settings,
  };
}

export async function createLegalPolicyMetadata(
  policyKey
) {
  const policy =
    await getCmsContent(
      policyKey
    );

  if (
    !policy ||
    policy.status !==
      "published"
  ) {
    return {
      title:
        "Policy unavailable",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const seo =
    policy.seo || {};

  const title =
    normalizeText(
      seo.title,
      policy.title
    );

  const description =
    normalizeText(
      seo.description,
      policy.content
        ?.summary
    );

  const canonical =
    normalizeText(
      seo.canonical,
      `/${policyKey}`
    );

  const socialImage =
    normalizeText(
      seo.ogImage,
      "/images/collection-artifact.jpeg"
    );

  const allowIndexing =
    seo.index !== false;

  return {
    title,
    description,

    keywords:
      normalizeText(
        seo.keywords
      )
        .split(",")
        .map(
          (keyword) =>
            keyword.trim()
        )
        .filter(Boolean),

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      url: canonical,
      siteName: "OBSIDIAN",
      title,
      description,

      images: [
        {
          url:
            socialImage,

          width: 1200,
          height: 630,

          alt:
            `${title} — OBSIDIAN`,
        },
      ],
    },

    twitter: {
      card:
        "summary_large_image",

      title,
      description,

      images: [
        socialImage,
      ],
    },

    robots: {
      index:
        allowIndexing,

      follow:
        allowIndexing,
    },
  };
}

export default async function LegalPolicyPage({
  policyKey,
}) {
  const {
    policy,
    settings,
  } =
    await getLegalPageData(
      policyKey
    );

  if (
    !policy ||
    policy.status !==
      "published"
  ) {
    notFound();
  }

  const storeName =
    normalizeText(
      settings?.store?.name,
      "OBSIDIAN"
    );

  const contactEmail =
    normalizeText(
      settings?.contact
        ?.email,
      "contact@obsidianwearbd.store"
    );

  const contactPhone =
    normalizeText(
      settings?.contact
        ?.phone
    );

  const templateValues = {
    storeName,
    contactEmail,
    contactPhone:
      contactPhone ||
      "the contact number shown on our website",
  };

  const content =
    policy.content || {};

  const title =
    replaceTemplateValues(
      content.title ||
        policy.title,
      templateValues
    );

  const eyebrow =
    replaceTemplateValues(
      content.eyebrow,
      templateValues
    );

  const summary =
    replaceTemplateValues(
      content.summary,
      templateValues
    );

  const version =
    normalizeText(
      policy.version
    );

  const effectiveDate =
    formatPolicyDate(
      policy.effectiveDate
    );

  const reviewedDate =
    formatPolicyDate(
      policy.lastReviewedAt
    );

  const sections =
    getVisibleSections(
      content.sections
    );

  const relatedPolicies =
    getVisibleRelatedPolicies(
      content.relatedPolicies
    );

  const canonical =
    normalizeText(
      policy.seo?.canonical,
      `/${policyKey}`
    );

  const jsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "WebPage",

    name: title,

    url:
      getAbsoluteUrl(
        canonical
      ),

    description:
      summary,

    datePublished:
      normalizeText(
        policy.effectiveDate
      ) || undefined,

    dateModified:
      normalizeText(
        policy.lastReviewedAt
      ) ||
      normalizeText(
        policy.effectiveDate
      ) ||
      undefined,

    publisher: {
      "@type":
        "Organization",

      name:
        storeName,

      url:
        SITE_URL,
    },
  };

  const contactDescription =
    replaceTemplateValues(
      content.contactDescription,
      templateValues
    );

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            serializeJsonLd(
              jsonLd
            ),
        }}
      />

      <article className="px-5 pb-24 pt-32 sm:px-6 lg:px-10 lg:pb-32 lg:pt-40">
        <header className="mx-auto max-w-[1180px] border-b border-black/15 pb-10 md:pb-14">
          <p className="text-xs uppercase tracking-[0.42em] text-neutral-500">
            {eyebrow ||
              "Legal"}
          </p>

          <h1 className="mt-6 max-w-5xl font-heading text-5xl font-light leading-[0.95] sm:text-6xl md:text-8xl">
            {title}
          </h1>

          {summary ? (
            <p className="mt-7 max-w-3xl text-base leading-8 text-neutral-600 md:text-lg md:leading-9">
              {summary}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
            {version ? (
              <p>
                Version {version}
              </p>
            ) : null}

            {effectiveDate ? (
              <p>
                Effective{" "}
                {effectiveDate}
              </p>
            ) : null}

            {reviewedDate ? (
              <p>
                Reviewed{" "}
                {reviewedDate}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1180px] gap-12 pt-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20 lg:pt-16">
          <aside className="h-fit lg:sticky lg:top-28">
            <p className="text-[10px] uppercase tracking-[0.34em] text-neutral-500">
              Contents
            </p>

            <nav
              aria-label={`${title} sections`}
              className="mt-5 border-t border-black/10"
            >
              {sections.map(
                (section) => (
                  <a
                    key={
                      section.id
                    }
                    href={`#${section.id}`}
                    className="block border-b border-black/10 py-4 text-xs leading-5 text-neutral-600 transition hover:text-black"
                  >
                    {
                      section.title
                    }
                  </a>
                )
              )}
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="space-y-12 md:space-y-16">
              {sections.map(
                (section) => {
                  const paragraphs =
                    Array.isArray(
                      section.paragraphs
                    )
                      ? section.paragraphs
                      : [];

                  const bullets =
                    Array.isArray(
                      section.bullets
                    )
                      ? section.bullets
                      : [];

                  return (
                    <section
                      key={
                        section.id
                      }
                      id={
                        section.id
                      }
                      className="scroll-mt-32 border-b border-black/10 pb-12 md:pb-16"
                    >
                      <h2 className="font-heading text-3xl font-light leading-tight md:text-4xl">
                        {
                          section.title
                        }
                      </h2>

                      {paragraphs.length >
                      0 ? (
                        <div className="mt-6 space-y-5">
                          {paragraphs.map(
                            (
                              paragraph,
                              index
                            ) => (
                              <p
                                key={`${section.id}-paragraph-${index}`}
                                className="text-[15px] leading-8 text-neutral-700 md:text-base"
                              >
                                {replaceTemplateValues(
                                  paragraph,
                                  templateValues
                                )}
                              </p>
                            )
                          )}
                        </div>
                      ) : null}

                      {bullets.length >
                      0 ? (
                        <ul className="mt-6 space-y-4">
                          {bullets.map(
                            (
                              bullet,
                              index
                            ) => (
                              <li
                                key={`${section.id}-bullet-${index}`}
                                className="flex gap-4 text-[15px] leading-8 text-neutral-700 md:text-base"
                              >
                                <span
                                  aria-hidden="true"
                                  className="mt-[0.85rem] h-1 w-1 shrink-0 rounded-full bg-black"
                                />

                                <span>
                                  {replaceTemplateValues(
                                    bullet,
                                    templateValues
                                  )}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      ) : null}
                    </section>
                  );
                }
              )}
            </div>

            <section className="mt-12 border border-black/15 bg-[#e9e2d8] p-6 sm:p-8 md:mt-16 md:p-10">
              <p className="text-[10px] uppercase tracking-[0.34em] text-neutral-500">
                Support
              </p>

              <h2 className="mt-4 font-heading text-3xl font-light md:text-4xl">
                {replaceTemplateValues(
                  content.contactTitle,
                  templateValues
                ) ||
                  "Questions or requests"}
              </h2>

              {contactDescription ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-700 md:text-base md:leading-8">
                  {
                    contactDescription
                  }
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                {contactEmail ? (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="border border-black bg-black px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-[#f1ece4] transition hover:opacity-80"
                  >
                    Email Support
                  </a>
                ) : null}

                {contactPhone ? (
                  <a
                    href={`tel:${contactPhone.replace(
                      /[^\d+]/g,
                      ""
                    )}`}
                    className="border border-black/25 px-5 py-3 text-[10px] uppercase tracking-[0.24em] transition hover:border-black"
                  >
                    Call Support
                  </a>
                ) : null}
              </div>
            </section>

            {relatedPolicies.length >
            0 ? (
              <section className="mt-12 md:mt-16">
                <p className="text-[10px] uppercase tracking-[0.34em] text-neutral-500">
                  Related Policies
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {relatedPolicies.map(
                    (relatedPolicy) => (
                      <Link
                        key={
                          relatedPolicy.id
                        }
                        href={
                          relatedPolicy.href
                        }
                        className="flex items-center justify-between border border-black/15 px-5 py-4 text-xs uppercase tracking-[0.18em] transition hover:border-black hover:bg-black hover:text-[#f1ece4]"
                      >
                        <span>
                          {
                            relatedPolicy.label
                          }
                        </span>

                        <span
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
