import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { CONTENT_TAG, isHeadless } from '../../content';

/**
 * Called by SchoolForge Studio when the school is published, so visitors see
 * the new content straight away.
 */
export async function POST(request: Request) {
    const token = process.env.SCHOOLFORGE_CONTENT_TOKEN;

    if (!isHeadless || !token || request.headers.get('authorization') !== `Bearer ${token}`) {
        return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    revalidateTag(CONTENT_TAG, { expire: 0 });

    return NextResponse.json({ revalidated: true });
}
