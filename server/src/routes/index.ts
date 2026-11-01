import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import {
  categoriesController,
  contentController,
  featuredController,
  getArticleController,
  healthController,
  latestController,
  listArticlesController,
  relatedController,
  searchController,
  sourcesController,
} from '../controllers/article.controller.js';
import { validateQuery } from '../middlewares/validate.js';

const listQuerySchema = z.object({
  category: z.string().optional(),
  source: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const latestQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(6).default(6),
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Thiếu từ khoá tìm kiếm'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const contentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const apiRouter = Router();

apiRouter.use(apiLimiter);

apiRouter.get('/health', healthController);
apiRouter.get('/categories', categoriesController);
apiRouter.get('/sources', sourcesController);

apiRouter.get('/articles/latest', validateQuery(latestQuerySchema), latestController);
apiRouter.get('/articles/featured', validateQuery(featuredQuerySchema), featuredController);
apiRouter.get('/articles', validateQuery(listQuerySchema), listArticlesController);
apiRouter.get('/articles/:id', getArticleController);
apiRouter.get('/articles/:id/related', validateQuery(relatedQuerySchema), relatedController);
apiRouter.get('/articles/:id/content', contentLimiter, contentController);

apiRouter.get('/search', validateQuery(searchQuerySchema), searchController);
