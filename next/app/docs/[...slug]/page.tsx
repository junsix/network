import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Hero } from "@/components/layout/Hero";
import { findTopic, allTopics, adjacent } from "@/lib/topics";

interface Props {
  params: Promise<{ slug: string[] }>;
}

/**
 * Catch-all docs router. Tries to dynamically import the matching MDX
 * file from `content/<slug>.mdx`. If it doesn't exist yet, renders a
 * placeholder so navigation works while content is being migrated.
 *
 * Each MDX file is expected to default-export a React component that
 * renders the body, and optionally export `meta` (eyebrow, title, lead).
 */
export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const joined = slug.join("/");
  const topic = findTopic(joined);
  if (!topic) notFound();

  const { prev, next } = adjacent(joined);

  // Try to load MDX. The path is statically analyzable enough for webpack.
  let MdxBody: React.ComponentType | null = null;
  let mdxMeta: {
    eyebrow?: string;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    lead?: React.ReactNode;
  } | null = null;
  try {
    const mod = await import(`@/content/${joined}.mdx`);
    MdxBody = mod.default;
    mdxMeta = mod.meta ?? null;
  } catch {
    // file doesn't exist yet: fall through to placeholder
  }

  return (
    <PageShell>
      <Hero
        eyebrow={mdxMeta?.eyebrow ?? topic.ord ?? "Docs"}
        title={mdxMeta?.title ?? topic.title}
        subtitle={mdxMeta?.subtitle ?? topic.subtitle}
        lead={mdxMeta?.lead}
        level={topic.level}
        parallax={false}
      />

      {MdxBody ? (
        <article className="prose-net">
          <MdxBody />
        </article>
      ) : (
        <div className="mt-8 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 shadow-inner-top">
          <p className="text-sm text-fg-muted">
            이 페이지는 곧 MDX로 채워집니다.
            <code className="ml-1 rounded border border-white/[0.06] bg-bg-elevated px-1.5 py-0.5 font-mono text-[12px] text-fg">
              content/{joined}.mdx
            </code>
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-widest">이전</span>
              <span className="text-fg">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex items-center gap-2 text-right text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-widest">다음</span>
              <span className="text-fg">{next.title}</span>
            </span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>
    </PageShell>
  );
}

export function generateStaticParams() {
  return allTopics.map((t) => ({ slug: t.slug.split("/") }));
}
