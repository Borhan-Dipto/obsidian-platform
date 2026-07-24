import { requireAdminPermission } from "../../../../../lib/adminAuth";
import EditProductClient from "../../../../../components/admin/EditProductClient";

export const dynamic = "force-dynamic";

export default async function EditProductPage() {
  await requireAdminPermission({
    products: ["update"],
  });

  return <EditProductClient />;
}