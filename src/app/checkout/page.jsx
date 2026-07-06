"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [settings, setSettings] = useState({
    store: {
      name: "OBSIDIAN",
      currency: "BDT",
    },
    contact: {
      whatsappNumber: "8801814455199",
    },
    delivery: {
      insideDhaka: 80,
      outsideDhaka: 130,
    },
    payment: {
      cashOnDelivery: true,
    },
  });

  const [deliveryArea, setDeliveryArea] = useState("inside_dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (response.ok && data.success) {
          setSettings(data.settings);
        }
      } catch {
        // fallback settings will be used
      }
    }

    loadSettings();
  }, []);

  const deliveryCharge =
    deliveryArea === "inside_dhaka"
      ? Number(settings.delivery?.insideDhaka) || 0
      : Number(settings.delivery?.outsideDhaka) || 0;

  const grandTotal = cartTotal + deliveryCharge;

  const currency = settings.store?.currency || "BDT";
  const currencySymbol = currency === "BDT" ? "৳" : currency;

  const whatsappNumber = String(
    settings.contact?.whatsappNumber || ""
  ).replace(/\D/g, "");

  const storeName = settings.store?.name || "Obsidian";

  function handleChange(e) {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!whatsappNumber) {
      alert("Store WhatsApp number is missing. Please contact admin.");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customer: {
        ...formData,
        deliveryArea,
      },
      items: cartItems,
      subtotal: cartTotal,
      deliveryCharge,
      total: grandTotal,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Order could not be submitted. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const orderItems = cartItems
        .map(
          (item) =>
            `${item.name}%0ASize: ${item.size}%0AQty: ${
              item.quantity
            }%0APrice: ${currencySymbol} ${
              Number(item.price) * Number(item.quantity)
            }`
        )
        .join("%0A%0A");

      const message =
        `Hello ${storeName},%0A%0AI want to place an order.%0A%0A` +
        `Order ID: ${data.order.id}%0A` +
        `Customer Name: ${formData.fullName}%0A` +
        `Phone: ${formData.phone}%0A` +
        `Email: ${formData.email || "Not provided"}%0A` +
        `Address: ${formData.address}%0A` +
        `Delivery Area: ${
          deliveryArea === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"
        }%0A` +
        `Note: ${formData.note || "No note"}%0A%0A` +
        `Order Items:%0A${orderItems}%0A%0A` +
        `Subtotal: ${currencySymbol} ${cartTotal}%0A` +
        `Delivery: ${currencySymbol} ${deliveryCharge}%0A` +
        `Total: ${currencySymbol} ${grandTotal}%0A%0A` +
        `Please confirm my order.`;

      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");

      clearCart();
      router.push("/success");
    } catch {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-20 lg:px-10 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Checkout
          </p>

          <div className="mb-12 flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              Complete Order
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10 md:p-14">
              <h2 className="font-heading text-4xl font-light">
                Your cart is empty.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">
                Add an Obsidian piece to your cart before checkout.
              </p>

              <Link
                href="/shop"
                className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="border border-black/10 bg-[#eee7dd] p-7 md:p-9">
                  <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
                    Customer Details
                  </p>

                  <div className="grid gap-6">
                    {[
                      ["fullName", "Full Name", "text", true],
                      ["phone", "Phone Number", "tel", true],
                      ["email", "Email Optional", "email", false],
                    ].map(([name, label, type, required]) => (
                      <div key={name}>
                        <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-neutral-500">
                          {label}
                        </label>
                        <input
                          type={type}
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          required={required}
                          className="w-full border-b border-black/20 bg-transparent py-2.5 text-base outline-none transition focus:border-black"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-black/10 bg-[#eee7dd] p-7 md:p-9">
                  <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
                    Delivery
                  </p>

                  <div className="mb-7 grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryArea("inside_dhaka")}
                      className={`border px-5 py-4 text-left text-xs uppercase tracking-[0.25em] transition ${
                        deliveryArea === "inside_dhaka"
                          ? "border-black bg-black text-[#f1ece4]"
                          : "border-black/20 text-[#0b0b0b] hover:bg-black hover:text-[#f1ece4]"
                      }`}
                    >
                      Inside Dhaka / {currencySymbol}{" "}
                      {Number(settings.delivery?.insideDhaka) || 0}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryArea("outside_dhaka")}
                      className={`border px-5 py-4 text-left text-xs uppercase tracking-[0.25em] transition ${
                        deliveryArea === "outside_dhaka"
                          ? "border-black bg-black text-[#f1ece4]"
                          : "border-black/20 text-[#0b0b0b] hover:bg-black hover:text-[#f1ece4]"
                      }`}
                    >
                      Outside Dhaka / {currencySymbol}{" "}
                      {Number(settings.delivery?.outsideDhaka) || 0}
                    </button>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-neutral-500">
                        Full Delivery Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={4}
                        required
                        className="w-full resize-none border-b border-black/20 bg-transparent py-2.5 text-base outline-none transition focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-neutral-500">
                        Order Note Optional
                      </label>
                      <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        rows={2}
                        className="w-full resize-none border-b border-black/20 bg-transparent py-2.5 text-base outline-none transition focus:border-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-black/10 bg-[#eee7dd] p-7 md:p-9">
                  <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                    Payment
                  </p>

                  <div className="grid gap-2 text-sm leading-7 text-neutral-600 sm:grid-cols-3">
                    <p>✓ Cash on Delivery</p>
                    <p>✓ Manual Confirmation</p>
                    <p>✓ Easy Exchange</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-7 w-full bg-[#0b0b0b] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#f1ece4] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting Order..." : "Place Order"}
                  </button>

                  <p className="mt-4 text-center text-xs leading-6 text-neutral-500">
                    Orders are reviewed manually before confirmation.
                  </p>
                </div>
              </form>

              <aside className="h-fit border border-black/10 bg-[#eee7dd] p-7 lg:sticky lg:top-28">
                <p className="mb-5 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  Summary
                </p>

                <h2 className="font-heading text-4xl font-light">
                  Order Summary
                </h2>

                <div className="mt-8 space-y-6 border-y border-black/10 py-6">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-20 object-cover"
                      />

                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                          {item.series}
                        </p>

                        <h3 className="mt-2 font-heading text-2xl font-light">
                          {item.name}
                        </h3>

                        <p className="mt-2 text-sm text-neutral-600">
                          {item.color || "Obsidian Black"}
                        </p>

                        <p className="mt-1 text-sm text-neutral-600">
                          Size {item.size} / Qty {item.quantity}
                        </p>
                      </div>

                      <p className="text-sm">
                        {currencySymbol}{" "}
                        {Number(item.price) * Number(item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 space-y-5 text-sm">
                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>
                      {currencySymbol} {cartTotal}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Delivery</span>
                    <span>
                      {currencySymbol} {deliveryCharge}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">Payment</span>
                    <span>Cash on Delivery</span>
                  </div>
                </div>

                <div className="mt-7 border-t border-black/10 pt-7">
                  <div className="flex justify-between gap-6">
                    <span className="font-heading text-3xl font-light">
                      Total
                    </span>
                    <span className="font-heading text-3xl font-light">
                      {currencySymbol} {grandTotal}
                    </span>
                  </div>
                </div>

                <div className="mt-7 space-y-2 border-t border-black/10 pt-6 text-sm text-neutral-600">
                  <p>✓ 2-5 Days Delivery</p>
                  <p>✓ Cash on Delivery</p>
                  <p>✓ Order confirmation via WhatsApp</p>
                </div>

                <Link
                  href="/cart"
                  className="mt-7 flex w-full justify-center border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
                >
                  Back To Cart
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}