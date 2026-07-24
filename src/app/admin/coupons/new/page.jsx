import { requireAdminPermission } from "../../../../lib/adminAuth";
import AddCouponClient from "../../../../components/admin/AddCouponClient";

export const dynamic = "force-dynamic";

export default async function AddCouponPage() {
  await requireAdminPermission({
    coupons: ["create"],
  });

  return <AddCouponClient />;
}