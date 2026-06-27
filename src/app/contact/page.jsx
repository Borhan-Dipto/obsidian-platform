import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom grid gap-16 md:grid-cols-2">
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Contact
            </p>

            <h1 className="font-heading text-6xl font-light md:text-8xl">
              Reach Obsidian
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-700">
              For product questions, order support, collaborations, or general
              inquiries, contact the Obsidian team.
            </p>
          </div>

          <div className="border border-black/10 bg-[#eee7dd] p-8">
            <div className="space-y-10">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                  Email
                </p>
                <p className="text-lg">support@obsidianwear.com</p>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                  WhatsApp
                </p>
                <p className="text-lg">+880 1XXXXXXXXX</p>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
                  Location
                </p>
                <p className="text-lg">Dhaka, Bangladesh</p>
              </div>
            </div>

            <a
              href="#"
              className="mt-12 inline-block border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-white"
            >
              Message On WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}