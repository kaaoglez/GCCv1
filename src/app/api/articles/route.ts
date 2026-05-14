import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type {
  ArticleDTO,
  UserSummaryDTO,
  ArticleCategory,
  PaginatedResponse,
} from '@/lib/types';

// GET /api/articles?category=&search=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') as ArticleCategory | null;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    // Build where clause — only published articles
    const where: Record<string, unknown> = { isPublished: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
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
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    const data: ArticleDTO[] = articles.map(mapArticleToDTO);

    const response: PaginatedResponse<ArticleDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/articles]', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

function mapArticleToDTO(article: {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    municipality: string | null;
    isVerified: boolean;
    role: string;
    businessName: string | null;
  };
  category: string;
  image: string | null;
  tags: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
}): ArticleDTO {
  let tags: string[] = [];
  try {
    tags = JSON.parse(article.tags || '[]');
  } catch {
    tags = [];
  }

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
