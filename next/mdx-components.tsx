import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Global MDX element mapping. Custom components (Lane, PCBox, etc.)
 * are imported per-file inside MDX to keep things explicit & tree-shakable.
 *
 * Visual styling is applied by wrapping content in <div class="prose-net">
 * at the page level (see app/docs/[...slug]/page.tsx).
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Wrap internal links with next/link for client-side nav.
    a: ({ href = "", children, ...props }) => {
      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link href={href} {...(props as Record<string, unknown>)}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    ...components,
  };
}
