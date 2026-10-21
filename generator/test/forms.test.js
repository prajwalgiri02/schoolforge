import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { ROOT } from '../src/lib/paths.js';

const forms = JSON.parse(readFileSync(path.join(ROOT, 'registry/runtime/forms.json'), 'utf8'));
const fieldTypes = ['text', 'email', 'tel', 'date', 'select', 'textarea', 'file', 'checkbox', 'hidden'];

test('every form definition is complete and consistent', () => {
    assert.deepEqual(Object.keys(forms).sort(), ['admission', 'alumni', 'job', 'testimonial']);

    for (const [type, form] of Object.entries(forms)) {
        const fields = form.steps.flatMap((step) => step.fields);
        const names = fields.map((field) => field.name);

        assert.ok(form.label.en && form.label.ne, `${type} has labels in both languages`);
        assert.match(form.referencePrefix, /^[A-Z]{3}$/, type);
        assert.ok(form.statuses.length >= 3, type);
        assert.equal(new Set(names).size, names.length, `${type} field names are unique`);
        assert.ok(names.includes('email'), `${type} asks for an email address (for confirmations and status lookups)`);
        assert.ok(names.includes('name'), `${type} has a name field (stored as the submitter's name)`);

        for (const field of fields) {
            assert.ok(fieldTypes.includes(field.type), `${type}.${field.name} has a known type`);
            assert.ok(field.label.en && field.label.ne, `${type}.${field.name} is labelled in both languages`);

            if (field.type === 'file') {
                assert.ok(field.accept?.length > 0 && field.maxSizeMb > 0, `${type}.${field.name} limits file types and size`);
            }

            if (field.type === 'select') {
                assert.ok(field.options.every((option) => option.value && option.label.en && option.label.ne), `${type}.${field.name} options are labelled`);
            }
        }
    }
});

test('publishable forms wait for approval', () => {
    for (const type of ['alumni', 'testimonial']) {
        assert.equal(forms[type].statuses[0], 'pending');
        assert.ok(forms[type].statuses.includes('approved'));
    }
});
