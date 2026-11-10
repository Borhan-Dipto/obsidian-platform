import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "../../../../../../lib/adminApiAuthorization";
import { PRODUCTS_COLLECTION_NAME, getCatalogDatabase } from "../../../../../../lib/catalog";
import { getProductImages } from "../../../../../../lib/productImages.js";
import {
  SOCIAL_LIMITS,
  buildSocialDraft,
  composeSocialText,
  parseHashtags,
} from "../../../../../../lib/socialPost.js";
import {
  getResolvedSocialConfig,
  publishToFacebook,
  publishToInstagram,
  toSocialImageUrl,
} from "../../../../../../lib/metaSocialPublisher.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PATH = "/api/admin/products/[id]/social-post";

function siteUrl(request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
}

async function loadProduct(context) {
  const { id } = await context.params;
  const productId = decodeURIComponent(String(id || "")).trim();

  if (!productId) {
    return { database: null, product: null };
  }

  const database = await getCatalogDatabase();
  const product = await database.collection(PRODUCTS_COLLECTION_NAME).findOne({ id: productId });

  return { database, product };
}

function productUrl(request, product) {
  return `${siteUrl(request)}/product/${encodeURIComponent(product.id)}`;
}

/* Connection status + a fresh, editable draft for the admin panel. */
export async function GET(request, context) {
  const authorization = await requireAdminApiPermission(request, { products: ["update"] }, { path: PATH });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { product } = await loadProduct(context);

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }

  const config = await getResolvedSocialConfig();

  return NextResponse.json({
    success: true,
    facebookReady: config.facebookReady,
    instagramReady: config.instagramReady,
    draft: buildSocialDraft(product, productUrl(request, product)),
    social: product.social || null,
  });
}

function text(value, max) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

/* Posts the product now, with the captions/hashtags/comment the owner approved. */
export async function POST(request, context) {
  const authorization = await requireAdminApiPermission(
    request,
    { products: ["update"] },
    { path: PATH, forbiddenMessage: "You do not have permission to post products." }
  );

  if (!authorization.authorized) {
    return authorization.response;
  }

  const config = await getResolvedSocialConfig();

  if (!config.facebookReady) {
    return NextResponse.json(
      { success: false, message: "Facebook & Instagram are not connected yet." },
      { status: 409 }
    );
  }

  const { database, product } = await loadProduct(context);

  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }

  if (product.isActive === false) {
    return NextResponse.json({ success: false, message: "Only active products can be posted." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const draft = buildSocialDraft(product, productUrl(request, product));
  const wantFacebook = body.facebook !== false;
  const wantInstagram = body.instagram !== false && config.instagramReady;

  const facebookText = composeSocialText(
    text(body.facebookCaption, SOCIAL_LIMITS.caption) || draft.facebookCaption,
    parseHashtags(body.facebookHashtags ?? draft.facebookHashtags)
  );
  const instagramText = composeSocialText(
    text(body.instagramCaption, SOCIAL_LIMITS.caption) || draft.instagramCaption,
    parseHashtags(body.instagramHashtags ?? draft.instagramHashtags)
  );
  const comment = body.linkInComment === false ? "" : text(body.comment, SOCIAL_LIMITS.comment) || draft.comment;

  const rawImages = getProductImages(product).filter(Boolean).slice(0, 10);

  if (rawImages.length === 0) {
    return NextResponse.json({ success: false, message: "Add a product photo first." }, { status: 400 });
  }

  const facebookImages = rawImages
    .map((url) => toSocialImageUrl(url, siteUrl(request), "facebook"))
    .filter(Boolean);

  const instagramImages = rawImages
    .map((url) => toSocialImageUrl(url, siteUrl(request), "instagram"))
    .filter(Boolean);

  const result = { postedAt: new Date(), errors: [] };

  if (wantFacebook) {
    try {
      const images = facebookImages;
      const facebook = await publishToFacebook(config, { images, message: facebookText, comment });
      result.facebookPostId = facebook.postId;
      result.facebookCommentId = facebook.commentId;

      if (facebook.commentError) {
        result.errors.push(`Facebook comment: ${facebook.commentError}`);
      }
    } catch (error) {
      result.errors.push(`Facebook: ${error.message}`);
    }
  }

  if (wantInstagram) {
    try {
      const images = instagramImages;
      result.instagramMediaId = (await publishToInstagram(config, { images, caption: instagramText })).mediaId;
    } catch (error) {
      result.errors.push(`Instagram: ${error.message}`);
    }
  }

  const posted = Boolean(result.facebookPostId || result.instagramMediaId);

  await database.collection(PRODUCTS_COLLECTION_NAME).updateOne(
    { _id: product._id },
    {
      $set: {
        "social.lastAttemptAt": result.postedAt,
        "social.lastErrors": result.errors,
        ...(posted
          ? {
              "social.postedAt": result.postedAt,
              "social.facebookPostId": result.facebookPostId || "",
              "social.facebookCommentId": result.facebookCommentId || "",
              "social.instagramMediaId": result.instagramMediaId || "",
            }
          : {}),
      },
    }
  );

  return NextResponse.json(
    {
      success: posted && result.errors.length === 0,
      posted,
      facebookPostId: result.facebookPostId || "",
      facebookCommentId: result.facebookCommentId || "",
      instagramMediaId: result.instagramMediaId || "",
      errors: result.errors,
    },
    { status: posted ? 200 : 502 }
  );
}
