import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Lock, Save } from 'lucide-react';
import type { FormEvent, KeyboardEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, StudioLayout } from '@/studio/StudioLayout';

type Props = {
    component: { name: string; label: string; description: string; category: string; variants: string[]; requires: string[] };
    code: string;
    canEditCode: boolean;
};

/**
 * Insert spaces instead of moving focus when Tab is pressed in the code editor.
 */
function handleTab(event: KeyboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
    if (event.key !== 'Tab' || event.shiftKey) {
        return;
    }

    event.preventDefault();
    const target = event.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    onChange(`${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`);
    requestAnimationFrame(() => target.setSelectionRange(selectionStart + 4, selectionStart + 4));
}

export default function ComponentEdit({ component, code, canEditCode }: Props) {
    const form = useForm({
        label: component.label,
        description: component.description,
        variants: component.variants.join(', '),
        ...(canEditCode ? { code } : {}),
    });
    const errors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(`/components/${component.name}`, { preserveScroll: true });
    };

    return (
        <StudioLayout title={component.label}>
            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <Link href="/components" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                    <ArrowLeft className="h-4 w-4" /> All components
                </Link>
                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h1 className="text-xl font-semibold">{component.label}</h1>
                            <code className="text-xs text-zinc-500">generator/registry/components/{component.name}</code>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="label" className="mb-1.5 block text-sm font-medium">
                                    Display name
                                </label>
                                <input id="label" value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} className={inputClass} />
                                <FieldError message={errors.label} />
                            </div>
                            <div>
                                <label htmlFor="variants" className="mb-1.5 block text-sm font-medium">
                                    Layouts <span className="font-normal text-zinc-400">(comma separated, first is the default)</span>
                                </label>
                                <input id="variants" value={form.data.variants} onChange={(event) => form.setData('variants', event.target.value)} className={`${inputClass} font-mono`} />
                                <FieldError message={errors.variants} />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                                    Description
                                </label>
                                <input id="description" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className={inputClass} />
                            </div>
                        </div>
                        {component.requires.length > 0 && (
                            <p className="mt-4 text-sm text-zinc-500">
                                Shown on default pages only when the school has: <code>{component.requires.join(', ')}</code>
                            </p>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
                            <code className="text-xs text-zinc-600">index.tsx</code>
                            {!canEditCode && (
                                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <Lock className="h-3.5 w-3.5" /> Read-only. Set SCHOOLFORGE_CODE_EDITING=true to edit code here.
                                </span>
                            )}
                        </div>
                        <textarea
                            aria-label="Component source code"
                            value={canEditCode ? (form.data.code ?? '') : code}
                            readOnly={!canEditCode}
                            onChange={(event) => form.setData('code', event.target.value)}
                            onKeyDown={(event) => handleTab(event, (value) => form.setData('code', value))}
                            spellCheck={false}
                            rows={32}
                            className="block w-full resize-y border-0 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 outline-none"
                        />
                        <FieldError message={errors.code} />
                    </section>
                    <p className="text-sm text-zinc-500">
                        Components receive <code>{'{ section, site, page }'}</code> and use the helpers in <code>generator/registry/runtime/ui.tsx</code>. Changes show in previews right away while <code>npm run dev</code> is running; generated sites pick them up on the next generate.
                    </p>
                    <div className="flex justify-end">
                        <button type="submit" disabled={form.processing} className={buttonClass.primary}>
                            <Save className="h-4 w-4" /> {form.processing ? 'Saving…' : 'Save component'}
                        </button>
                    </div>
                </form>
            </main>
        </StudioLayout>
    );
}
