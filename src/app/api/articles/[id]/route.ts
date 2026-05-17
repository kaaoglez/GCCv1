import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ArticleDTO, UserSummaryDTO, ArticleCategory } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await db.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            municipality: true,
            isVerified: true,
            role: true,
            businessName: true,
          },
        },
      },
    });

    if (!article || !article.isPublished) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await db.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const data = mapArticleToDTO(article);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[GET /api/articles/[id]]`, error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

function mapArticleToDTO(article: {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  authorId: string;
  author: { id: string; name: string; avatar: string | null; municipality: string | null; isVerified: boolean; role: string; businessName: string | null };
  category: string;
  image: string | null;
  tags: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
}): ArticleDTO {
  let tags: string[] = [];
  try { tags = JSON.parse(article.tags || '[]'); } catch { tags = []; }

  const author: UserSummaryDTO = {
    id: article.author.id,
    name: article.author.name,
    avatar: article.author.avatar ?? undefined,
    municipality: article.author.municipality ?? undefined,
    isVerified: article.author.isVerified,
    role: article.author.role as ArticleDTO['author']['role'],
    businessName: article.author.businessName ?? undefined,
  };

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    content: article.content,
    excerpt: article.excerpt ?? undefined,
    authorId: article.authorId,
    author,
    category: article.category as ArticleCategory,
    image: article.image ?? undefined,
    tags,
    isPublished: article.isPublished,
    publishedAt: article.publishedAt?.toISOString(),
    viewCount: article.viewCount,
    createdAt: article.createdAt.toISOString(),
  };
}
