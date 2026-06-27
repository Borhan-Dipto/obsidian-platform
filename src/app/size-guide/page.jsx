import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function SizeGuidePage() {
  const sizes = [
    {
      size: "M",
      chest: "40",
      length: "27",
      shoulder: "18",
    },
    {
      size: "L",
      chest: "42",
      length: "28",
      shoulder: "19",
    },
    {
      size: "XL",
      chest: "44",
      length: "29",
      shoulder: "20",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Size Guide
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            Find Your Fit
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
            Our pieces are designed with a relaxed oversized fit. Use the guide
            below to choose your preferred silhouette.
          </p>

          <div className="mt-16 overflow-hidden border border-black/10">
            <table className="w-full text-left">
              <thead className="bg-[#0b0b0b] text-[#f1ece4]">
                <tr>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.3em]">
                    Size
                  </th>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.3em]">
                    Chest
                  </th>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.3em]">
                    Length
                  </th>
                  <th className="px-6 py-5 text-xs uppercase tracking-[0.3em]">
                    Shoulder
                  </th>
                </tr>
              </thead>

              <tbody>
                {sizes.map((item) => (
                  <tr key={item.size} className="border-t border-black/10">
                    <td className="px-6 py-5">{item.size}</td>
                    <td className="px-6 py-5">{item.chest} in</td>
                    <td className="px-6 py-5">{item.length} in</td>
                    <td className="px-6 py-5">{item.shoulder} in</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-8 max-w-2xl text-sm leading-7 text-neutral-600">
            Measurements may vary slightly due to fabric, wash, and production
            process.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}