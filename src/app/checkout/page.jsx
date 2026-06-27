"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();

  const WHATSAPP_NUMBER = "8801XXXXXXXXX";

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
      total: cartTotal,
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
            `${item.name} × ${item.quantity} = ৳ ${
              item.price * item.quantity
            }`
        )
        .join("%0A");

      const message =
        `Hello Obsidian,%0A%0AI want to place an order.%0A%0A` +
        `Order ID: ${data.order.id}%0A` +
        `Customer Name: ${formData.fullName}%0A` +
        `Phone: ${formData.phone}%0A` +
        `Email: ${formData.email || "Not provided"}%0A` +
        `Address: ${formData.address}%0A%0A` +
        `Order Items:%0A${orderItems}%0A%0A` +
        `Total: ৳ ${cartTotal}%0A%0A` +
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

          <div className="grid gap-12 md:grid-cols-2">
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
                {isSubmitting ? "Submitting Order..." : "Place Order On WhatsApp"}
              </button>
            </form>

            <div className="border border-black/10 bg-[#eee7dd] p-8">
              <h2 className="font-heading text-4xl">Order Summary</h2>

              <div className="mt-8 space-y-5">
                {cartItems.length === 0 ? (
                  <p className="text-neutral-600">Your cart is empty.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-6">
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span>৳ {item.price * item.quantity}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 border-t border-black/10 pt-6">
                <h3 className="font-heading text-3xl">Total: ৳ {cartTotal}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}