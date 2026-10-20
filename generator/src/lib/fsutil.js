import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${file}`);
        }

        throw new Error(`Could not parse JSON in ${file}: ${error.message}`);
    }
}

export function writeJson(file, data) {
    writeFile(file, `${JSON.stringify(data, null, 4)}\n`);
}

export function writeFile(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
}

export function exists(file) {
    return fs.existsSync(file);
}

export function isEmptyDir(dir) {
    return !fs.existsSync(dir) || fs.readdirSync(dir).length === 0;
}

export function hashContents(contents) {
    return createHash('sha256').update(contents).digest('hex').slice(0, 16);
}

export function hashFile(file) {
    return fs.existsSync(file) ? hashContents(fs.readFileSync(file)) : null;
}

/**
 * Lists every file under `dir` as paths relative to it, using forward slashes.
 */
export function listFiles(dir, base = dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);

        return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full).split(path.sep).join('/')];
    });
}

/**
 * Replaces `{{key}}` placeholders with values from `vars`. Unknown keys are left untouched.
 */
export function renderTemplate(contents, vars) {
    return contents.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

/**
 * Copies a template directory into `dest`, rendering placeholders in text files.
 * Files ending in `.tpl` are written without that suffix.
 */
export function copyTemplateDir(src, dest, vars = {}) {
    const written = [];

    for (const relative of listFiles(src)) {
        const target = path.join(dest, relative.replace(/\.tpl$/, ''));
        const contents = fs.readFileSync(path.join(src, relative), 'utf8');
        writeFile(target, renderTemplate(contents, vars));
        written.push(path.relative(dest, target).split(path.sep).join('/'));
    }

    return written;
}

export function removeFile(file) {
    fs.rmSync(file, { force: true });

    let dir = path.dirname(file);

    while (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
    }
}

export function toPosix(file) {
    return file.split(path.sep).join('/');
}
