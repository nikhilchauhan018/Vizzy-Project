import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DJANGO_PORT = 8000;

// Generic reverse-proxy helper forwarding requests to Django REST Framework backend
const createDjangoProxy = (prefix: string) => (req: Request, res: Response) => {
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: DJANGO_PORT,
    path: `${prefix}${req.url}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${DJANGO_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error ${prefix}]:`, err.message);
    res.status(502).json({ detail: 'Django backend service unavailable. Please retry.' });
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method || '') && req.body) {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }

  proxyReq.end();
};

// Route accounts and stories APIs to Django
app.use('/api/accounts', createDjangoProxy('/api/accounts'));
app.use('/api/stories', createDjangoProxy('/api/stories'));

// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================
app.post('/api/story/extract-bibles', (_req: Request, res: Response): void => {
  res.json({
    art_style: 'Gritty cinematic graphic novel, heavy ink shadows, high tonal contrast',
    palette: ['#1A2530', '#3E505B', '#8C9BA5', '#D87A43', '#F2E8DC'],
    lighting_default: 'High contrast chiaroscuro with directional key light and deep atmospheric shadows',
    aspect_ratio: '16:9',
    render_medium: 'Ink wash with digital watercolor and film grain',
    locked_style_prompt_prefix: 'Masterpiece graphic novel illustration, high tonal depth, cinematic framing, ink line art',
    characters: [
      {
        name: 'Protagonist',
        role: 'Lead Operative',
        age: 'Mid 30s',
        appearance: 'Determined weathered facial features, intense gaze, athletic silhouette',
        uniform: 'Field tactical coat with reinforced utility belts and brass buckles',
        hair: 'Short dark cropped hair, disheveled from motion',
      },
    ],
    environments: [
      {
        name: 'Industrial Rooftop',
        description: 'Vast concrete rooftop overlooking dense neon-lit rain-slicked city towers',
        weather: 'Cold torrential rain with low-hanging fog and misty haze',
        time_of_day: 'Midnight twilight with distant amber neon reflections',
      },
    ],
  });
});

// Mount Vite middleware for dev server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Vizzy] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Vizzy] Failed to start server:', err);
  process.exit(1);
});
