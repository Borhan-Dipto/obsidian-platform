"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

function statusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status] || "Pending";
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanId = orderId.trim();

    if (!cleanId) {
      setMessage("Please enter your tracking ID.");
      setOrder(null);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Order not found.");
        return;
      }

      setOrder(data.order);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-24 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[980px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Order Tracking
          </p>

          <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
            Track Order
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600">
            Enter your OBSIDIAN tracking ID to check your order status.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-12 border border-black/10 bg-[#eee7dd] p-7 md:p-10"
          >
            <label className="mb-3 block text-xs uppercase tracking-[0.32em] text-neutral-500">
              Tracking ID
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Example: OBS-123456789"
                className="w-full border border-black/15 bg-[#f1ece4] px-5 py-4 text-base outline-none transition focus:border-black"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85 disabled:opacity-50"
              >
                {isLoading ? "Checking..." : "Track"}
              </button>
            </div>

            {message && (
              <p className="mt-5 text-sm leading-7 text-red-700">{message}</p>
            )}
          </form>

          {order && (
            <div className="mt-10 border border-black/10 bg-[#eee7dd]">
              <div className="border-b border-black/10 p-7 md:p-10">
                <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                  Order Status
                </p>

                <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div>
                    <h2 className="font-heading text-5xl font-light">
                      {statusLabel(order.status)}
                    </h2>

                    <p className="mt-3 text-sm text-neutral-600">
                      Tracking ID: {order.orderId}
                    </p>
                  </div>

                  <p className="text-sm text-neutral-600">
                    Total: ৳ {order.total}
                  </p>
                </div>
              </div>

              <div className="grid gap-0 md:grid-cols-2">
                <div className="border-b border-black/10 p-7 md:border-b-0 md:border-r md:p-10">
                  <p className="mb-5 text-xs uppercase tracking-[0.32em] text-neutral-500">
                    Customer
                  </p>

                  <div className="space-y-3 text-sm leading-7 text-neutral-700">
                    <p>{order.customer?.fullName}</p>
                    <p>{order.customer?.phone}</p>
                    <p>{order.customer?.address}</p>
                  </div>
                </div>

                <div className="p-7 md:p-10">
                  <p className="mb-5 text-xs uppercase tracking-[0.32em] text-neutral-500">
                    Items
                  </p>

                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="flex justify-between gap-5 text-sm"
                      >
                        <span>
                          {item.name} / Size {item.size} × {item.quantity}
                        </span>
                        <span>৳ {Number(item.price) * Number(item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/shop"
              className="inline-flex border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
            >
              Back To Shop
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}