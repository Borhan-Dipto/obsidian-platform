/*
 * Server-only: publishes a product to the OBSIDIAN Facebook Page and
 * Instagram professional account through Meta's Graph API.
 *
 * Environment (set in Vercel, never in code):
 *   META_PAGE_ID            Facebook Page ID
 *   META_PAGE_ACCESS_TOKEN  Page (or System User) access token — Secret
 *   META_IG_USER_ID         Instagram professional account ID (optional)
 */

const DEFAULT_GRAPH_API_VERSION = "v26.0";
const REQUEST_TIMEOUT_MS = 20000;

function readEnv(name) {
  return String(process.env[name] || "").trim();
}

export function getSocialConfig() {
  const version = readEnv("META_GRAPH_API_VERSION");
  const pageId = readEnv("META_PAGE_ID");
  const token = readEnv("META_PAGE_ACCESS_TOKEN");
  const instagramId = readEnv("META_IG_USER_ID");

  return {
    apiBase: `https://graph.facebook.com/${/^v\d+\.\d+$/.test(version) ? version : DEFAULT_GRAPH_API_VERSION}`,
    pageId: /^\d{5,30}$/.test(pageId) ? pageId : "",
    instagramId: /^\d{5,30}$/.test(instagramId) ? instagramId : "",
    token,
    facebookReady: /^\d{5,30}$/.test(pageId) && token.length > 20,
    instagramReady: /^\d{5,30}$/.test(pageId) && /^\d{5,30}$/.test(instagramId) && token.length > 20,
  };
}

/*
 * Absolute, Meta-friendly image URLs.
 * platform: "facebook" → 1200×628 (1.91:1 landscape, cropped from centre)
 *           "instagram" → 1080×1080 (1:1 square, cropped from centre)
 *           undefined   → original image converted to JPEG at q_90
 */
export function toSocialImageUrl(url, siteUrl, platform) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  const absolute = value.startsWith("http")
    ? value
    : `${String(siteUrl || "").replace(/\/+$/, "")}${value.startsWith("/") ? "" : "/"}${value}`;

  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(absolute)) {
    let transform;
    if (platform === "facebook") {
      // 1200×628 centre-crop, JPEG
      transform = "c_fill,g_center,w_1200,h_628,f_jpg,q_90";
    } else if (platform === "instagram") {
      // 1080×1080 centre-crop, JPEG
      transform = "c_fill,g_center,w_1080,h_1080,f_jpg,q_90";
    } else {
      transform = "f_jpg,q_90";
    }
    return absolute.replace("/image/upload/", `/image/upload/${transform}/`);
  }

  return absolute;
}

async function graphRequest(config, path, params, { method = "POST", token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = new URLSearchParams({ ...params, access_token: token || config.token });
    const response =
      method === "GET"
        ? await fetch(`${config.apiBase}/${path}?${body}`, { signal: controller.signal, cache: "no-store" })
        : await fetch(`${config.apiBase}/${path}`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body,
            signal: controller.signal,
          });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw new Error(data.error?.error_user_msg || data.error?.message || `Meta error ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

/* A System User token must be exchanged for the Page's own token before posting. */
async function getPageToken(config) {
  try {
    const data = await graphRequest(config, config.pageId, { fields: "access_token" }, { method: "GET" });
    return data.access_token || config.token;
  } catch {
    return config.token;
  }
}

/*
 * Instagram account linked to the Page. Uses META_IG_USER_ID when set,
 * otherwise asks Meta once (so the owner only needs the Page ID + token).
 */
let discoveredInstagramId = null;

export async function resolveInstagramId(config) {
  if (config.instagramId || !config.facebookReady) {
    return config.instagramId;
  }

  if (discoveredInstagramId === null) {
    try {
      const data = await graphRequest(config, config.pageId, { fields: "instagram_business_account" }, { method: "GET" });
      discoveredInstagramId = String(data.instagram_business_account?.id || "");
    } catch {
      return "";
    }
  }

  return discoveredInstagramId;
}

/* Config with the Instagram account filled in when it can be found. */
export async function getResolvedSocialConfig() {
  const config = getSocialConfig();
  const instagramId = await resolveInstagramId(config);

  return { ...config, instagramId, instagramReady: config.facebookReady && /^\d{5,30}$/.test(instagramId) };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForInstagramMedia(config, containerId) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const data = await graphRequest(config, containerId, { fields: "status_code" }, { method: "GET" });

    if (data.status_code === "FINISHED") {
      return;
    }

    if (data.status_code === "ERROR") {
      throw new Error("Instagram could not process an image (use JPG, ratio between 4:5 and 1.91:1).");
    }

    await wait(1500);
  }

  throw new Error("Instagram is still processing the images. Try again in a minute.");
}

export async function publishToFacebook(config, { images, message, comment }) {
  const pageToken = await getPageToken(config);
  let postId;

  if (images.length === 1) {
    postId = (await graphRequest(config, `${config.pageId}/photos`, { url: images[0], message }, { token: pageToken })).post_id;
  } else {
    const params = { message };
    let index = 0;

    for (const url of images) {
      const photo = await graphRequest(config, `${config.pageId}/photos`, { url, published: "false" }, { token: pageToken });
      params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: photo.id });
      index += 1;
    }

    postId = (await graphRequest(config, `${config.pageId}/feed`, params, { token: pageToken })).id;
  }

  let commentId = "";
  let commentError = "";

  if (comment && postId) {
    try {
      commentId = (await graphRequest(config, `${postId}/comments`, { message: comment }, { token: pageToken })).id;
    } catch (error) {
      commentError = error.message;
    }
  }

  return { postId, commentId, commentError };
}

export async function publishToInstagram(config, { images, caption }) {
  let containerId;

  if (images.length === 1) {
    containerId = (await graphRequest(config, `${config.instagramId}/media`, { image_url: images[0], caption })).id;
  } else {
    const children = [];

    for (const url of images.slice(0, 10)) {
      children.push((await graphRequest(config, `${config.instagramId}/media`, { image_url: url, is_carousel_item: "true" })).id);
    }

    for (const child of children) {
      await waitForInstagramMedia(config, child);
    }

    containerId = (
      await graphRequest(config, `${config.instagramId}/media`, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption,
      })
    ).id;
  }

  await waitForInstagramMedia(config, containerId);

  return { mediaId: (await graphRequest(config, `${config.instagramId}/media_publish`, { creation_id: containerId })).id };
}
