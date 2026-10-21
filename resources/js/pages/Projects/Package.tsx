import { useForm } from '@inertiajs/react';
import { Check, CircleCheck, FileText, Clock } from 'lucide-react';
import { buttonClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import type { ProjectSummary } from '@/studio/types';

type Plan = { id: number; name: string; price: string; period: 'month' | 'year'; description: string | null };

type Props = {
    project: ProjectSummary;
    plans: Plan[];
    currentPlanId: number | null;
    paidUntil: string | null;
    isPaid: boolean;
    trialEndsAt: string | null;
    trialEnded: boolean;
    invoice: { id: number; number: string; description: string; amount: string; dueOn: string } | null;
    paymentInstructions: string | null;
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function PackagePage({ project, plans, currentPlanId, paidUntil, isPaid, trialEndsAt, trialEnded, invoice, paymentInstructions }: Props) {
    const form = useForm({ plan_id: currentPlanId ?? plans[0]?.id ?? 0 });

    const choose = (plan: Plan) => {
        const message = invoice ? `Switch to ${plan.name}? Invoice ${invoice.number} is cancelled and a new one issued.` : `Choose ${plan.name} (${plan.price} a ${plan.period})? An invoice is issued for you to pay.`;

        if (window.confirm(message)) {
            form.transform(() => ({ plan_id: plan.id }));
            form.post(`/projects/${project.slug}/package`, { preserveScroll: true });
        }
    };

    return (
        <ProjectLayout project={project} title="Package" preview={false}>
            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Your package</h2>
                    {isPaid ? (
                        <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                            <CircleCheck className="h-4 w-4" /> Paid until {formatDate(paidUntil!)}. You can publish your website from the Publish tab.
                        </p>
                    ) : trialEnded ? (
                        <p className="mt-2 text-sm text-red-700">Your free trial has ended. Choose a package and pay its invoice to keep editing and publish your website. Everything you built is kept.</p>
                    ) : (
                        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                            <Clock className="h-4 w-4 text-zinc-400" />
                            {trialEndsAt ? `Free trial until ${formatDate(trialEndsAt)}. ` : ''}Build and preview your whole website for free. To publish it, choose a monthly or yearly package.
                        </p>
                    )}
                </section>

                {invoice && (
                    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                        <h2 className="flex items-center gap-2 font-semibold text-amber-900">
                            <FileText className="h-5 w-5" /> Invoice {invoice.number} is waiting for payment
                        </h2>
                        <p className="mt-2 text-sm text-amber-900">
                            {invoice.description}: <strong>{invoice.amount}</strong>, due {formatDate(invoice.dueOn)}. We confirm your payment and then you can publish.
                        </p>
                        {paymentInstructions && <p className="mt-3 whitespace-pre-line rounded-lg bg-white p-4 text-sm text-zinc-800">{paymentInstructions}</p>}
                        <a href={`/projects/${project.slug}/invoices/${invoice.id}`} target="_blank" rel="noreferrer" className={`${buttonClass.secondary} mt-4`}>
                            <FileText className="h-4 w-4" /> View invoice
                        </a>
                    </section>
                )}

                <section>
                    <h2 className="font-semibold">Packages</h2>
                    {plans.length === 0 ? (
                        <p className="mt-2 text-sm text-zinc-500">No packages are available yet. Please contact us to publish your website.</p>
                    ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {plans.map((plan) => {
                                const current = plan.id === currentPlanId && (isPaid || invoice !== null);

                                return (
                                    <div key={plan.id} className={`flex flex-col rounded-xl border-2 bg-white p-6 shadow-sm ${current ? 'border-indigo-600' : 'border-zinc-200'}`}>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{plan.period === 'year' ? 'Yearly' : 'Monthly'}</p>
                                        <h3 className="mt-1 text-lg font-semibold">{plan.name}</h3>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {plan.price} <span className="text-sm font-normal text-zinc-500">/ {plan.period}</span>
                                        </p>
                                        {plan.description && <p className="mt-2 text-sm text-zinc-600">{plan.description}</p>}
                                        <div className="mt-auto pt-5">
                                            {current ? (
                                                <p className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                                                    <Check className="h-4 w-4" /> {isPaid ? 'Your package' : 'Chosen, awaiting payment'}
                                                </p>
                                            ) : (
                                                <button type="button" disabled={form.processing} onClick={() => choose(plan)} className={`${buttonClass.primary} w-full`}>
                                                    Choose {plan.name}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </ProjectLayout>
    );
}
