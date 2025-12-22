import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { createApolloServer } from './server';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT ?? 4000);

const app = express();

// Local uploads folder
const uploadsDir = path.resolve(process.cwd(), 'uploads');

// Ensure uploads dir exists at startup
fs.mkdirSync(uploadsDir, { recursive: true });

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Basic middlewares
app.use(cors());
app.use(express.json());

// Multer - store files on disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Helper: build public base URL
function getPublicBaseUrl(req: express.Request): string {
  const envBase = process.env.PUBLIC_UPLOADS_BASE_URL;
  if (envBase && envBase.trim().length > 0) return envBase.replace(/\/+$/g, '');

  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = typeof protoHeader === 'string' ? protoHeader : 'http';
  const host = req.headers.host ?? `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// REST: upload product image + persist metadata
// FormData:
// - file: image
// - productId: string
// - makePrimary: "true" | "false" (optional)
app.post('/uploads/product-image', upload.single('file'), async (req, res) => {
  try {
    const productId = typeof req.body?.productId === 'string' ? req.body.productId : '';
    const makePrimary = req.body?.makePrimary === 'true';

    if (!productId) return res.status(400).json({ error: 'productId is required' });
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const key = req.file.filename;
    const baseUrl = getPublicBaseUrl(req);
    const url = `${baseUrl}/uploads/${encodeURIComponent(key)}`;

    if (makePrimary) {
      await prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: {
        productId,
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
      url: image.url,
      key: image.key,
      isPrimary: image.isPrimary,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

async function start() {
  const server: ApolloServer = createApolloServer();
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async () => ({}),
    }),
  );

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
