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
  refreshController,
  relatedController,
  rssController,
  searchController,
  sourcesController,
} from '../controllers/article.controller.js';
import { validateQuery, validateBody } from '../middlewares/validate.js';
import {
  requestPasswordResetController,
  verifyPasswordResetCodeController,
} from '../controllers/auth.controller.js';

const listQuerySchema = z.object({
  category: z.string().optional(),
  source: z.string().optional(),
  q: z.string().optional(),
  since: z.string().datetime({ offset: true }).optional(),
  until: z.string().datetime({ offset: true }).optional(),
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

const rssQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(6).default(6),
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Thiếu từ khoá tìm kiếm'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Email không đúng định dạng.'),
});

const passwordResetVerifySchema = z.object({
  email: z.string().email('Email không đúng định dạng.'),
  code: z.string().min(1, 'Thiếu mã bảo mật.'),
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

/** Gửi mã bảo mật qua email — giới hạn chặt để tránh bị spam hộp thư. */
const resetRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Bạn đã yêu cầu quá nhiều mã bảo mật. Vui lòng thử lại sau 1 phút.',
    },
  },
});

/** Kiểm tra mã bảo mật — mã 6 số nên phải giới hạn số lần đoán. */
const resetVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Bạn đã thử mã bảo mật quá nhiều lần. Vui lòng thử lại sau 1 phút.',
    },
  },
});

export const apiRouter = Router();

apiRouter.use(apiLimiter);

apiRouter.get('/health', healthController);
apiRouter.get('/categories', categoriesController);
apiRouter.get('/sources', sourcesController);
apiRouter.post('/refresh', refreshController);

apiRouter.get('/articles/latest', validateQuery(latestQuerySchema), latestController);
apiRouter.get('/articles/featured', validateQuery(featuredQuerySchema), featuredController);
apiRouter.get('/articles/rss.xml', validateQuery(rssQuerySchema), rssController);
apiRouter.get('/articles', validateQuery(listQuerySchema), listArticlesController);
apiRouter.get('/articles/:id', getArticleController);
apiRouter.get('/articles/:id/related', validateQuery(relatedQuerySchema), relatedController);
apiRouter.get('/articles/:id/content', contentLimiter, contentController);

apiRouter.get('/search', validateQuery(searchQuerySchema), searchController);

apiRouter.post(
  '/auth/password-reset/request',
  resetRequestLimiter,
  validateBody(passwordResetRequestSchema),
  requestPasswordResetController,
);
apiRouter.post(
  '/auth/password-reset/verify',
  resetVerifyLimiter,
  validateBody(passwordResetVerifySchema),
  verifyPasswordResetCodeController,
);
