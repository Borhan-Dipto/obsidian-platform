"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [isSaving, setIsSaving] = useState(false);

  async function updateStatus(e) {
    const newStatus = e.target.value;

    setStatus(newStatus);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert("Failed to update order status.");
        setStatus(currentStatus);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
      setStatus(currentStatus);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-[0.25em] text-neutral-500">
        Order Status
      </label>

      <select
        value={status}
        onChange={updateStatus}
        disabled={isSaving}
        className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
      >
        {statuses.map((item) => (
          <option
            key={item}
            value={item}
            className="bg-[#0b0b0b]"
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </option>
        ))}
      </select>

      {isSaving && (
        <p className="text-xs text-neutral-500">
          Updating status...
        </p>
      )}
    </div>
  );
}