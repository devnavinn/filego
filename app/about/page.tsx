import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileImage,
  FileText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About | Filego",
  description:
    "Learn about Filego, our mission, values, and the way we build simple file tools for modern work.",
};

const values = [
  {
    title: "Simple by default",
    description:
      "We remove steps, reduce friction, and make common file tasks feel fast and obvious.",
    icon: Sparkles,
  },
  {
    title: "Privacy aware",
    description:
      "We design tools to minimize unnecessary data handling and keep users in control.",
    icon: ShieldCheck,
  },
  {
    title: "Built for speed",
    description:
      "Performance matters. File work should feel instant, responsive, and reliable.",
    icon: Zap,
  },
];

const highlights = [
  {
    title: "Image tools",
    description:
      "Compress, convert, and optimize images without a complicated workflow.",
    icon: FileImage,
  },
  {
    title: "PDF workflows",
    description:
      "Handle merges, splits, conversions, and edits in one clean interface.",
    icon: FileText,
  },
  {
    title: "Modern UX",
    description:
      "Designed for people who need file tools often and don’t want to fight the UI.",
    icon: Sparkles,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">
              About Filego
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              File tools that feel lighter, faster, and easier to trust.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Filego is built to make everyday file work simpler. From image
              compression to PDF workflows, we focus on tools that are fast to
              open, easy to use, and practical for real work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/bulk-image-compress">
                  Try Filego
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:px-6 md:grid-cols-3 md:py-20">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Our story
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              We built Filego because file tasks are still more frustrating than
              they should be.
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-7 text-muted-foreground md:text-base">
            <p>
              Too many file tools feel cluttered, slow, or overly aggressive
              with uploads, paywalls, and confusing flows. We wanted a cleaner
              alternative that focuses on the core job: helping people get from
              input to output with less friction.
            </p>
            <p>
              Filego is designed around practical workflows. That means faster
              actions, clearer interfaces, and tools that work well for
              freelancers, teams, students, and businesses that deal with files
              every day.
            </p>
            <p>
              Our goal is not to overload the product with everything at once.
              It is to make the most useful file operations dependable,
              polished, and easy to return to.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Values</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              What guides the way we build
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <Card key={value.title} className="rounded-2xl bg-background">
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:px-6 md:grid-cols-3 md:py-24">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Focus</p>
              <p className="mt-2 text-2xl font-semibold">Useful tools</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                We prioritize file actions people actually need every week, not
                novelty features.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Approach</p>
              <p className="mt-2 text-2xl font-semibold">Product-first</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Clear interfaces, fast execution, and steady iteration shape how
                we improve Filego.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Promise</p>
              <p className="mt-2 text-2xl font-semibold">Less friction</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Every feature should reduce time, clicks, confusion, or
                unnecessary handling.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-24">
          <p className="text-sm font-medium text-muted-foreground">
            Get started
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Start with one task and see how fast file work can feel.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            Try Filego with image compression, PDF utilities, and more. No steep
            learning curve, just focused tools built for getting work done.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-xl">
              <Link href="/bulk-image-compress">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/privacy">Privacy</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
