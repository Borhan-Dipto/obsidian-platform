import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import Hero from "../components/sections/Hero";
import Collections from "../components/sections/Collections";
import BrandStory from "../components/sections/BrandStory";
import FeaturedProduct from "../components/sections/FeaturedProduct";

export default function Home() {
  return (
    <main className="bg-[#0b0b0b]">
      <Navbar />
      <Hero />
      <Collections />
      <BrandStory />
      <FeaturedProduct />
      <Footer />
    </main>
  );
}