"use client";

import { useEffect, useState } from "react";

import { parseHashtags } from "../../lib/socialPost";

const fieldClass =
  "w-full border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 outline-none placeholder:text-neutral-600 focus:border-white/30";

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/*
 * "Post to Facebook & Instagram" panel on the product edit page.
 * Caption, hashtags and the first comment (order link) are generated
 * from the product and fully editable before posting.
 */
export default function SocialPostPanel({ productId }) {
  const [status, setStatus] = useState({ loading: true });
  const [draft, setDraft] = useState(null);
  const [facebookCaption, setFacebookCaption] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [facebookTags, setFacebookTags] = useState("");
  const [instagramTags, setInstagramTags] = useState("");
  const [comment, setComment] = useState("");
  const [toFacebook, setToFacebook] = useState(true);
  const [toInstagram, setToInstagram] = useState(true);
  const [linkInComment, setLinkInComment] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState(null);

  function applyDraft(next) {
    setFacebookCaption(next.facebookCaption);
    setInstagramCaption(next.instagramCaption);
    setFacebookTags(next.facebookHashtags.join(" "));
    setInstagramTags(next.instagramHashtags.join(" "));
    setComment(next.comment);
  }

  useEffect(() => {
    if (!productId) {
      return undefined;
    }

    let cancelled = false;

    fetch(`/api/admin/products/${encodeURIComponent(productId)}/social-post`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data.success) {
          setStatus({ loading: false, error: data.message || "Could not load." });
          return;
        }

        setStatus({
          loading: false,
          facebookReady: data.facebookReady,
          instagramReady: data.instagramReady,
          social: data.social,
        });
        setToInstagram(Boolean(data.instagramReady));
        setDraft(data.draft);
        applyDraft(data.draft);
      })
      .catch(() => !cancelled && setStatus({ loading: false, error: "Could not load." }));

    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function post() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setConfirming(false);
    setPosting(true);
    setMessage({ tone: "info", text: "Posting… this can take up to a minute." });

    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/social-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facebook: toFacebook,
          instagram: toInstagram,
          facebookCaption,
          instagramCaption,
          facebookHashtags: parseHashtags(facebookTags),
          instagramHashtags: parseHashtags(instagramTags),
          comment,
          linkInComment,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const done = [data.facebookPostId && "Facebook", data.instagramMediaId && "Instagram"].filter(Boolean);
      const parts = [];

      if (done.length) {
        parts.push(`Posted on ${done.join(" + ")} ✓`);
      }

      if (data.facebookCommentId) {
        parts.push("order link commented ✓");
      }

      if (data.errors?.length) {
        parts.push(data.errors.join(" · "));
      }

      if (!parts.length) {
        parts.push(data.message || "Posting failed.");
      }

      setMessage({ tone: data.success ? "ok" : done.length ? "warn" : "error", text: parts.join(" · ") });

      if (done.length) {
        setStatus((current) => ({
          ...current,
          social: { ...(current.social || {}), postedAt: new Date().toISOString() },
        }));
      }
    } catch {
      setMessage({ tone: "error", text: "Posting failed. Check your connection and try again." });
    } finally {
      setPosting(false);
    }
  }

  if (!productId) {
    return null;
  }

  const notConnected = !status.loading && !status.error && !status.facebookReady;
  const tagCount = (value) => parseHashtags(value).length;

  return (
    <section className="space-y-5 border border-white/10 p-5" aria-labelledby="social-post-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="social-post-title" className="text-[11px] uppercase tracking-[0.3em] text-neutral-300">
          Social media post
        </h2>

        {status.social?.postedAt ? (
          <span className="text-xs text-neutral-400">Last posted {formatDate(status.social.postedAt)}</span>
        ) : null}
      </div>

      {status.loading ? <p className="text-sm text-neutral-500">Loading…</p> : null}
      {status.error ? <p className="text-sm text-red-400">{status.error}</p> : null}

      {notConnected ? (
        <p className="text-sm leading-6 text-amber-300/90">
          Facebook & Instagram are not connected yet. You can still prepare the text below — posting
          turns on once the connection is set up.
        </p>
      ) : null}

      {draft ? (
        <>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={toFacebook} onChange={(event) => setToFacebook(event.target.checked)} />
              Facebook Page
            </label>

            <label className={`flex items-center gap-2 ${status.instagramReady ? "" : "opacity-40"}`}>
              <input
                type="checkbox"
                checked={toInstagram}
                disabled={!status.instagramReady}
                onChange={(event) => setToInstagram(event.target.checked)}
              />
              Instagram {status.instagramReady ? "" : "(not connected)"}
            </label>

            <button
              type="button"
              onClick={() => {
                applyDraft(draft);
                setMessage(null);
              }}
              className="ml-auto text-[11px] uppercase tracking-[0.2em] text-neutral-400 underline-offset-4 hover:text-white hover:underline"
            >
              Regenerate text
            </button>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">Facebook caption</span>
            <textarea rows={8} value={facebookCaption} onChange={(event) => setFacebookCaption(event.target.value)} className={fieldClass} />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
              Facebook hashtags ({tagCount(facebookTags)})
            </span>
            <input value={facebookTags} onChange={(event) => setFacebookTags(event.target.value)} className={fieldClass} placeholder="#OBSIDIAN #Streetwear" />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={linkInComment} onChange={(event) => setLinkInComment(event.target.checked)} />
            Post the order link as the first Facebook comment
          </label>

          {linkInComment ? (
            <label className="block space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">First comment</span>
              <input value={comment} onChange={(event) => setComment(event.target.value)} className={fieldClass} />
            </label>
          ) : null}

          {status.instagramReady ? (
            <>
              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">Instagram caption</span>
                <textarea rows={8} value={instagramCaption} onChange={(event) => setInstagramCaption(event.target.value)} className={fieldClass} />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Instagram hashtags ({tagCount(instagramTags)}/30)
                </span>
                <input value={instagramTags} onChange={(event) => setInstagramTags(event.target.value)} className={fieldClass} />
              </label>
            </>
          ) : null}

          <button
            type="button"
            onClick={post}
            disabled={posting || notConnected || (!toFacebook && !toInstagram)}
            className={`w-full px-6 py-4 text-xs uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
              confirming ? "bg-amber-300 text-[#0b0b0b]" : "bg-[#f1ece4] text-[#0b0b0b] hover:opacity-85"
            }`}
          >
            {posting
              ? "Posting…"
              : confirming
                ? "Tap again to confirm — this posts publicly"
                : status.social?.postedAt
                  ? "Post again to social media"
                  : "Post now to social media"}
          </button>

          {confirming ? (
            <button type="button" onClick={() => setConfirming(false)} className="w-full text-xs text-neutral-400 underline">
              Cancel
            </button>
          ) : null}

          {message ? (
            <p
              role="status"
              className={`text-sm leading-6 ${
                message.tone === "ok"
                  ? "text-emerald-400"
                  : message.tone === "error"
                    ? "text-red-400"
                    : message.tone === "warn"
                      ? "text-amber-300"
                      : "text-neutral-300"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
