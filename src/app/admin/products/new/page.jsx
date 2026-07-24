import { requireAdminPermission } from "../../../../lib/adminAuth";
import AddProductClient from "../../../../components/admin/AddProductClient";

export const dynamic = "force-dynamic";

export default async function AddProductPage() {
  await requireAdminPermission({
    products: ["create"],
  });

  return <AddProductClient />;
}