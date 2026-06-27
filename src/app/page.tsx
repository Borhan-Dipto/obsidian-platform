import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import Hero from "../components/sections/Hero";
import BrandStory from "../components/sections/BrandStory";
import Collections from "../components/sections/Collections";
import FeaturedProduct from "../components/sections/FeaturedProduct";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <BrandStory />
      <Collections />
      <FeaturedProduct />
      <Footer />
    </main>
  );
}