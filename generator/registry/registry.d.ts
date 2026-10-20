/**
 * Declaration of the component map that `schoolforge sync` writes to
 * `<school>/registry.ts` in a generated project. See runtime/page-renderer.tsx.
 */
import type { ComponentType } from 'react';
import type { SectionProps } from './runtime/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare const sectionComponents: Record<string, ComponentType<SectionProps<any>>>;
