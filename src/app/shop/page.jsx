import {
  buildShopMetadata,
  renderShopPage,
} from "../../components/shop/ShopPageView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  return buildShopMetadata(await searchParams);
}

export default async function ShopPage({ searchParams }) {
  return renderShopPage(await searchParams);
}
