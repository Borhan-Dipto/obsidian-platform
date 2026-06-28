"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();

  const WHATSAPP_NUMBER = "8801XXXXXXXXX";
  const deliveryCharge = 0;
  const grandTotal = cartTotal + deliveryCharge;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  });

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customer: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || "",
        address: formData.address,
      },
      items: cartItems,
      subtotal: cartTotal,
      deliveryCharge,
      total: grandTotal,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert("Order could not be submitted. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const orderItems = cartItems
        .map(
          (item) =>
            `${item.name}%0ASize: ${item.size}%0AQty: ${
              item.quantity
            }%0APrice: ৳ ${item.price * item.quantity}`
        )
        .join("%0A%0A");

      const message =
        `Hello Obsidian,%0A%0AI want to place an order.%0A%0A` +
        `Order ID: ${data.order.id}%0A` +
        `Customer Name: ${formData.fullName}%0A` +
        `Phone: ${formData.phone}%0A` +
        `Email: ${formData.email || "Not provided"}%0A` +
        `Address: ${formData.address}%0A%0A` +
        `Order Items:%0A${orderItems}%0A%0A` +
        `Subtotal: ৳ ${cartTotal}%0A` +
        `Delivery: Calculated later%0A` +
        `Total: ৳ ${grandTotal}%0A%0A` +
        `Please confirm my order.`;

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
        "_blank"
      );

      clearCart();
      router.push("/success");
    } catch (error) {
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Checkout
          </p>

          <h1 className="font-heading mb-16 text-6xl font-light md:text-8xl">
            Checkout
          </h1>

          {cartItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10">
              <p className="text-lg text-neutral-600">
                Your cart is currently empty.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-block border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-white"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full border border-black/10 bg-[#eee7dd] px-5 py-4 outline-none"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full border border-black/10 bg-[#eee7dd] px-5 py-4 outline-none"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-black/10 bg-[#eee7dd] px-5 py-4 outline-none"
                />

                <textarea
                  name="address"
                  placeholder="Delivery Address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={5}
                  required
                  className="w-full border border-black/10 bg-[#eee7dd] px-5 py-4 outline-none"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black px-8 py-5 text-xs uppercase tracking-[0.35em] text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Order..." : "Place Order"}
                </button>
              </form>

              <aside className="h-fit border border-black/10 bg-[#eee7dd] p-8">
                <h2 className="font-heading text-4xl">Order Summary</h2>

                <div className="mt-8 space-y-6">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-4 border-b border-black/10 pb-5 last:border-b-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 object-cover"
                      />

                      <div className="flex-1">
                        <p className="font-heading text-2xl">{item.name}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Size: {item.size}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p>৳ {item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4 border-t border-black/10 pt-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>৳ {cartTotal}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>Calculated later</span>
                  </div>

                  <div className="flex justify-between pt-4">
                    <span className="font-heading text-3xl">Total</span>
                    <span className="font-heading text-3xl">
                      ৳ {grandTotal}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}