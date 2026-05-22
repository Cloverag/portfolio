import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <Hero />

      {/* Placeholder sections for next phases */}
      <section id="about" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted mb-2">Coming next</p>
          <h2 className="text-4xl font-bold">About + Featured Skills</h2>
        </div>
      </section>
      <section id="projects" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted mb-2">Coming next</p>
          <h2 className="text-4xl font-bold">6 Project Cards</h2>
        </div>
      </section>
      <section id="cyber" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted mb-2">Coming next</p>
          <h2 className="text-4xl font-bold">Cyber Lab (toggleable)</h2>
        </div>
      </section>
      <section id="contact" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-muted mb-2">Coming next</p>
          <h2 className="text-4xl font-bold">Contact CTA</h2>
        </div>
      </section>
    </main>
  );
}
