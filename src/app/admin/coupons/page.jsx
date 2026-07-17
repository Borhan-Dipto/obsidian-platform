import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import { requireAdminAuth } from "../../../lib/adminAuth";
import CouponSearchTable from "../../../components/admin/CouponSearchTable";

async function getCoupons() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const coupons = await db
    .collection("coupons")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(coupons));
}

export default async function AdminCouponsPage() {
  await requireAdminAuth();

  const coupons = await getCoupons();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-14 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Coupons
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Coupons
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500">
              Create and manage promotional discount codes, validity dates,
              usage limits, order requirements and shipping offers.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/coupons/new"
              className="bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
            >
              Add Coupon
            </Link>

            <Link
              href="/admin"
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back
            </Link>
          </div>
        </div>

        {coupons.length === 0 ? (
          <div className="border border-white/10 px-6 py-16 text-center">
            <p className="font-heading text-4xl font-light text-[#f1ece4]">
              No coupons yet
            </p>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-500">
              Create your first promotional coupon to offer percentage
              discounts, fixed discounts or free shipping to customers.
            </p>

            <Link
              href="/admin/coupons/new"
              className="mt-8 inline-flex bg-[#f1ece4] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80"
            >
              Create First Coupon
            </Link>
          </div>
        ) : (
          <CouponSearchTable coupons={coupons} />
        )}
      </div>
    </main>
  );
}