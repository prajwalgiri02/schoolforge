export type FieldType = 'text' | 'textarea' | 'url' | 'image' | 'file' | 'date' | 'boolean' | 'strings' | 'paragraphs' | 'link' | 'items' | 'icon';

export type FieldDefinition = {
    name: string;
    type: FieldType;
    label: string;
    required: boolean;
    help?: string;
    fields?: FieldDefinition[];
};

export type SectionDefinition = {
    label: string;
    description: string;
    kind: 'object' | 'list';
    target: string;
    fields: FieldDefinition[];
    itemLabel?: string;
};

/** JSON-like value edited in the admin forms. */
export type Value = string | number | boolean | null | undefined | Value[] | { [key: string]: Value };

export type Item = { [key: string]: Value };

export type SharedProps = {
    schoolName: string;
    auth: { user: { id: number; name: string; email: string } | null };
    flash: { success?: string | null };
};
