import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import Hero from "../components/sections/Hero";
import BrandStory from "../components/sections/BrandStory";
import Collections from "../components/sections/Collections";
import FeaturedProduct from "../components/sections/FeaturedProduct";

export default function Home() {
  return (
    <main className="bg-[#0b0b0b]">
      <Navbar />
      <Hero />

      <div className="relative h-44 overflow-hidden bg-[#eee7dd]">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#0b0b0b_0%,#0b0b0b_8%,rgba(11,11,11,0.92)_18%,rgba(35,32,28,0.82)_34%,rgba(91,82,70,0.48)_56%,rgba(180,166,144,0.26)_74%,#eee7dd_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_center,rgba(241,236,228,0.18),transparent_62%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_bottom,transparent,#eee7dd)]" />
      </div>

      <Collections />

      <div className="relative h-48 overflow-hidden bg-[#0b0b0b]">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#eee7dd_0%,#eee7dd_10%,rgba(238,231,221,0.86)_22%,rgba(156,141,119,0.42)_45%,rgba(44,39,34,0.72)_70%,#0b0b0b_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,#eee7dd,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_center,rgba(177,132,74,0.16),transparent_68%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_bottom,transparent,#0b0b0b)]" />
      </div>

      <BrandStory />
      <FeaturedProduct />
      <Footer />
    </main>
  );
}