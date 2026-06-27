"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    series: "",
    color: "",
    price: "",
    stock: "",
    image: "",
    description: "",
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setFormData({
          id: data.product.id || "",
          name: data.product.name || "",
          series: data.product.series || "",
          color: data.product.color || "",
          price: String(data.product.price || ""),
          stock: String(data.product.stock || ""),
          image: data.product.image || "",
          description: data.product.description || "",
        });
      } catch (error) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    };

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert("Product could not be updated.");
        setIsSubmitting(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      alert("Something went wrong while updating product.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="container-custom">
          <p className="text-neutral-400">Loading product...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="container-custom">
          <p className="mb-6 text-neutral-400">Product not found.</p>

          <Link
            href="/admin/products"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back To Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom max-w-3xl">
        <div className="mb-14 flex items-center justify-between gap-6">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Products / Edit
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Edit Product
            </h1>
          </div>

          <Link
            href="/admin/products"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            ["id", "Product ID"],
            ["name", "Product Name"],
            ["series", "Series"],
            ["color", "Color"],
            ["price", "Price"],
            ["stock", "Stock"],
            ["image", "Image URL"],
          ].map(([name, placeholder]) => (
            <input
              key={name}
              name={name}
              placeholder={placeholder}
              value={formData[name]}
              onChange={handleChange}
              required
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
            />
          ))}

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            required
            className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#f1ece4] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Updating Product..." : "Update Product"}
          </button>
        </form>
      </div>
    </main>
  );
}