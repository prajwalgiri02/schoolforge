/**
 * Every component in the generator registry, keyed by name, for Studio's live
 * preview. New components appear automatically (Vite picks up new folders).
 */
import type { ComponentType } from 'react';
import type { SectionProps } from '@registry/runtime/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionComponent = ComponentType<SectionProps<any>>;

const modules = import.meta.glob<{ default: SectionComponent }>('../../../generator/registry/components/*/index.tsx', { eager: true });

export const sectionComponents: Record<string, SectionComponent> = Object.fromEntries(
    Object.entries(modules).map(([file, module]) => [file.split('/').at(-2) as string, module.default]),
);
