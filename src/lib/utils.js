import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn's `cn` helper — combines clsx (conditional class joining) with
 * tailwind-merge (deduplicates conflicting Tailwind classes). Standard helper
 * used by every shadcn component, so this needs to live at `@/lib/utils`.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
