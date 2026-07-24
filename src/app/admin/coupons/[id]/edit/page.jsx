import { requireAdminPermission } from "../../../../../lib/adminAuth";
import EditCouponClient from "../../../../../components/admin/EditCouponClient";

export const dynamic = "force-dynamic";

export default async function EditCouponPage() {
  await requireAdminPermission({
    coupons: ["update"],
  });

  return <EditCouponClient />;
}