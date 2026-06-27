import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function JournalPage() {
  const posts = [
    {
      title: "The Meaning Of Obsidian",
      description:
        "A short reflection on pressure, resilience, and the identity behind the brand.",
    },
    {
      title: "The Artifact Series",
      description:
        "How ancient visual language became the foundation of our first drop.",
    },
    {
      title: "Built Under Pressure",
      description:
        "Why we believe character, design, and purpose are formed slowly.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Journal
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            Stories Of Pressure
          </h1>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.title}
                className="border border-black/10 bg-[#eee7dd] p-8"
              >
                <h2 className="font-heading text-4xl font-light">
                  {post.title}
                </h2>

                <p className="mt-6 text-sm leading-7 text-neutral-600">
                  {post.description}
                </p>

                <p className="mt-10 text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Read Story →
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}