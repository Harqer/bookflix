import { CoffeeLogo } from "@/components/coffee-logo";
import { Button } from "@/components/ui/button";

const Page = () => {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="coffee-shell w-full max-w-6xl p-8 md:p-12 lg:p-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="coffee-pill">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9a5a3a]" />
              Warm reading, softly brewed
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-[#4a2a1d] sm:text-5xl lg:text-6xl">
                Cozy stories, comfort in every page.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#6f4d3a]">
                A velvet-toned reading space for curious minds, where every book feels like a quiet corner and a warm cup of coffee.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="coffee-button">
                Discover the collection
              </Button>
              <Button variant="outline" className="coffee-button-secondary">
                Browse the mood
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="coffee-panel">
              <div className="absolute inset-x-8 top-4 h-24 rounded-full bg-[#d8b48b]/30 blur-3xl" />
              <CoffeeLogo className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64" />
              <div className="coffee-note mt-6">
                A velvet café for stories, notes, and quiet mornings.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;