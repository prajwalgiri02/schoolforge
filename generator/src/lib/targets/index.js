import laravel from './laravel.js';
import nextjs from './nextjs.js';

const targets = { [nextjs.name]: nextjs, [laravel.name]: laravel };

export function getTarget(name = 'nextjs') {
    const target = targets[name];

    if (!target) {
        throw new Error(`Unknown target "${name}". Available: ${Object.keys(targets).join(', ')}.`);
    }

    return target;
}

export function listTargets() {
    return Object.values(targets);
}
