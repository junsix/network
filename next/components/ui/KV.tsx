/**
 * Term-definition grid. Cleanest way to write glossary-style content in MDX.
 *   <KV>
 *     <KVItem term="WEIGHT">Cisco 전용, 라우터 로컬</KVItem>
 *     <KVItem term="LOCAL_PREF">AS 내부 정책</KVItem>
 *   </KV>
 */
export function KV({ children }: { children: React.ReactNode }) {
  return (
    <dl className="my-3 grid grid-cols-1 gap-x-[18px] gap-y-2.5 text-[14px] sm:grid-cols-[180px_1fr]">
      {children}
    </dl>
  );
}

export function KVItem({
  term,
  children,
}: {
  term: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="pt-0.5 font-mono text-[12.5px] tracking-wide text-fg-muted">
        {term}
      </dt>
      <dd className="m-0 leading-[1.65] text-fg">{children}</dd>
    </>
  );
}
