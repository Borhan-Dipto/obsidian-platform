"use client";

import { useEffect, useRef } from "react";
import {
  buildViewContentParams,
  trackMetaEvent,
} from "../../lib/metaPixel";
import {
  buildGa4ItemEventParams,
  trackGa4Event,
} from "../../lib/googleAnalytics";

/*
 * Sends one ViewContent per product page view. The product data
 * comes from the server-rendered product page (database values),
 * not from anything the visitor can edit.
 */
export default function MetaViewContent({
  productId,
  productName,
  price,
  currency = "BDT",
}) {
  const trackedProductRef = useRef("");

  useEffect(() => {
    const id = String(productId || "");

    if (!id || trackedProductRef.current === id) {
      return;
    }

    const params = buildViewContentParams(
      {
        id,
        name: productName,
        price,
      },
      currency
    );

    if (!params) {
      return;
    }

    trackedProductRef.current = id;
    trackMetaEvent("ViewContent", params);

    trackGa4Event(
      "view_item",
      buildGa4ItemEventParams([
        { id, name: productName, price, quantity: 1 },
      ])
    );
  }, [productId, productName, price, currency]);

  return null;
}
