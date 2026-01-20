import 'dotenv/config';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import crypto from 'node:crypto';
import { createApolloServer } from './server';
import { prisma } from './lib/prisma';
import type { GraphQLContext } from './server-context';
import { getRequestAuth } from './auth/get-request-auth';
import { issueApiToken } from './auth/issue-api-token';
import { ZodError } from 'zod';
import { registerUser, loginUser } from './auth/auth.service';
import { AuthError, AUTH_ERROR_CODES } from './auth/auth.errors';
import { APP_ROLES } from '@ts-fullstack-learning/shared';
import { createProCheckoutSession } from './billing/billing.service';

const PORT = Number(process.env.PORT ?? 4000);

const app = express();

const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const ext = path.extname(safeOriginal) || '';
    const base = path.basename(safeOriginal, ext);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function createUploadSessionId(): string {
  return crypto.randomUUID();
}

async function safeUnlink(filePath: string) {
  try {
    await fsp.unlink(filePath);
  } catch {
    // ignore
  }
}

function getPublicBaseUrl(req: express.Request): string {
  const envBase = process.env.PUBLIC_UPLOADS_BASE_URL;
  if (envBase && envBase.trim().length > 0) return envBase.replace(/\/+$/g, '');

  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = typeof protoHeader === 'string' ? protoHeader : 'http';
  const host = req.headers.host ?? `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function normalizeProductImages(images: Array<{ id: string; url: string; isPrimary: boolean }>) {
  const hasPrimary = images.some((i) => i.isPrimary);
  if (!hasPrimary && images.length > 0) {
    return images.map((i, idx) => ({ ...i, isPrimary: idx === 0 }));
  }

  let primarySeen = false;
  return images.map((i) => {
    if (!i.isPrimary) return i;
    if (!primarySeen) {
      primarySeen = true;
      return i;
    }
    return { ...i, isPrimary: false };
  });
}

/**
 * API auth (prod-like):
 * Web calls POST /auth/login and receives an access token (JWS).
 * Web calls POST /auth/register to create a BUYER and auto-login.
 * Web then sends Authorization: Bearer <token> to /graphql.
 */
app.post('/auth/register', async (req, res) => {
  try {
    const { token } = await registerUser({
      email: req.body?.email,
      password: req.body?.password,
    });

    return res.status(201).json({ token });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }

    if (err instanceof AuthError) {
      if (err.code === AUTH_ERROR_CODES.EMAIL_TAKEN) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { token } = await loginUser({
      email: req.body?.email,
      password: req.body?.password,
    });

    return res.status(200).json({ token });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.issues });
    }

    if (err instanceof AuthError) {
      if (err.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/uploads/sessions', (_req, res) => {
  const uploadSession = createUploadSessionId();
  return res.status(201).json({ uploadSession });
});

app.post('/billing/checkout-session', async (req, res) => {
  try {
    const auth = await getRequestAuth(req);

    if (!auth.userId || !auth.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (auth.role !== APP_ROLES.MERCHANT && auth.role !== APP_ROLES.PLATFORM_OWNER) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY_ID;
    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price is not configured' });
    }

    const baseUrl = (process.env.WEB_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/g, '');
    const successUrl = `${baseUrl}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing?status=cancelled`;

    const session = await createProCheckoutSession({
      userId: auth.userId,
      priceId,
      successUrl,
      cancelUrl,
    });

    return res.status(201).json({ url: session.url });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.get('/uploads/sessions/:uploadSession', async (req, res) => {
  try {
    const uploadSession = req.params.uploadSession;
    if (!uploadSession) return res.status(400).json({ error: 'uploadSession is required' });

    const images = await prisma.productImage.findMany({
      where: { uploadSession, productId: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({ uploadSession, images });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to load session images' });
  }
});

app.delete('/uploads/sessions/:uploadSession', async (req, res) => {
  try {
    const uploadSession = req.params.uploadSession;
    if (!uploadSession) return res.status(400).json({ error: 'uploadSession is required' });

    const images = await prisma.productImage.findMany({
      where: { uploadSession, productId: null },
      select: { id: true, key: true },
    });

    await prisma.productImage.deleteMany({
      where: { uploadSession, productId: null },
    });

    await Promise.all(images.map((img) => safeUnlink(path.join(uploadsDir, img.key))));

    return res.status(200).json({ ok: true, deleted: images.length });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to cleanup session' });
  }
});

app.get('/products/:productId/images', async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, url: true, isPrimary: true },
    });

    return res.status(200).json({ images: normalizeProductImages(images) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to load product images' });
  }
});

app.delete('/products/:productId/images/:imageId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const imageId = req.params.imageId;

    if (!productId) return res.status(400).json({ error: 'productId is required' });
    if (!imageId) return res.status(400).json({ error: 'imageId is required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    if (image.productId !== productId) {
      return res.status(400).json({ error: 'Image does not belong to this product' });
    }

    const wasPrimary = image.isPrimary;
    const filePath = path.join(uploadsDir, image.key);

    await prisma.productImage.delete({ where: { id: imageId } });
    await safeUnlink(filePath);

    if (wasPrimary) {
      const newest = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (newest) {
        await prisma.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });

        await prisma.productImage.update({
          where: { id: newest.id },
          data: { isPrimary: true },
        });
      }
    }

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, url: true, isPrimary: true },
    });

    return res.status(200).json({ ok: true, images: normalizeProductImages(images) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

app.post('/uploads/attach', async (req, res) => {
  try {
    const uploadSession =
      typeof req.body?.uploadSession === 'string' ? req.body.uploadSession.trim() : '';
    const productId = typeof req.body?.productId === 'string' ? req.body.productId.trim() : '';
    const primaryImageIdRaw =
      typeof req.body?.primaryImageId === 'string' ? req.body.primaryImageId.trim() : '';
    const primaryImageId = primaryImageIdRaw.length > 0 ? primaryImageIdRaw : null;

    if (!uploadSession) return res.status(400).json({ error: 'uploadSession is required' });
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const attachResult = await prisma.productImage.updateMany({
      where: { uploadSession, productId: null },
      data: { productId },
    });

    let candidateId: string | null = null;

    if (primaryImageId) {
      candidateId = primaryImageId;
    } else {
      const sessionPrimary = await prisma.productImage.findFirst({
        where: { uploadSession, productId, isPrimary: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (sessionPrimary) {
        candidateId = sessionPrimary.id;
      } else {
        const newest = await prisma.productImage.findFirst({
          where: { uploadSession, productId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        candidateId = newest?.id ?? null;
      }
    }

    await prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });

    if (candidateId) {
      const updated = await prisma.productImage.updateMany({
        where: { id: candidateId, productId },
        data: { isPrimary: true },
      });

      if (updated.count === 0) {
        const newest = await prisma.productImage.findFirst({
          where: { uploadSession, productId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        if (newest) {
          await prisma.productImage.update({
            where: { id: newest.id },
            data: { isPrimary: true },
          });
        }
      }
    }

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, url: true, isPrimary: true },
    });

    return res.status(200).json({
      ok: true,
      attached: attachResult.count,
      productId,
      images: normalizeProductImages(images),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Attach failed' });
  }
});

app.post('/uploads/product-image', upload.single('file'), async (req, res) => {
  try {
    const uploadSession = typeof req.body?.uploadSession === 'string' ? req.body.uploadSession : '';

    const productIdRaw = typeof req.body?.productId === 'string' ? req.body.productId : '';
    const productId = productIdRaw.trim().length > 0 ? productIdRaw.trim() : null;

    const makePrimary = req.body?.makePrimary === 'true';

    if (!uploadSession) return res.status(400).json({ error: 'uploadSession is required' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ error: 'Product not found' });
    }

    const key = req.file.filename;
    const baseUrl = getPublicBaseUrl(req);
    const url = `${baseUrl}/uploads/${encodeURIComponent(key)}`;

    if (makePrimary) {
      if (productId) {
        await prisma.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      } else {
        await prisma.productImage.updateMany({
          where: { uploadSession, productId: null, isPrimary: true },
          data: { isPrimary: false },
        });
      }
    }

    const image = await prisma.productImage.create({
      data: {
        productId,
        uploadSession,
        key,
        url,
        mime: req.file.mimetype,
        size: req.file.size,
        width: null,
        height: null,
        isPrimary: makePrimary,
      },
    });

    return res.status(201).json({
      id: image.id,
      productId: image.productId,
      uploadSession: image.uploadSession,
      url: image.url,
      key: image.key,
      mime: image.mime,
      size: image.size,
      width: image.width,
      height: image.height,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

app.delete('/uploads/product-image/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const image = await prisma.productImage.findUnique({ where: { id } });
    if (!image) return res.status(404).json({ error: 'Not found' });

    if (image.productId) {
      return res.status(400).json({ error: 'Cannot delete attached image' });
    }

    const filePath = path.join(uploadsDir, image.key);

    await prisma.productImage.delete({ where: { id } });
    await safeUnlink(filePath);

    return res.status(200).json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

async function start() {
  const server = createApolloServer();
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const auth = await getRequestAuth(req);
        return { auth };
      },
    }),
  );

  app.get('/debug/auth', async (req, res) => {
    const auth = await getRequestAuth(req);
    return res.status(200).json(auth);
  });

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API ready at http://localhost:${PORT}/graphql`);
    // eslint-disable-next-line no-console
    console.log(`Uploads served at http://localhost:${PORT}/uploads`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err);
  process.exit(1);
});
