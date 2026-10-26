import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REGISTRY_DIR = process.env.SCHOOLFORGE_REGISTRY ? path.resolve(process.env.SCHOOLFORGE_REGISTRY) : path.join(ROOT, 'registry');
export const COMPONENTS_DIR = path.join(REGISTRY_DIR, 'components');
export const THEMES_DIR = path.join(REGISTRY_DIR, 'themes');
export const RUNTIME_DIR = path.join(REGISTRY_DIR, 'runtime');
export const PRESETS_DIR = path.join(REGISTRY_DIR, 'presets');
export const TARGETS_DIR = path.join(ROOT, 'targets');
export const SAMPLE_FILES_DIR = path.join(ROOT, 'examples', 'files');
export const SCHEMA_FILE = path.join(ROOT, 'schema', 'school.schema.json');
export const LOCK_FILE = '.schoolforge.json';
export const PROJECT_CONFIG_FILE = 'school.config.json';
