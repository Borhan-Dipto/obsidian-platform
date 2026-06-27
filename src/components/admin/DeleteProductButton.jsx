"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert("Product could not be deleted.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="border border-red-500 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500 hover:text-white"
    >
      Delete
    </button>
  );
}