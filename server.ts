import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy for WooCommerce
app.post('/api/woo/proxy', async (req, res) => {
  const { url, consumerKey, consumerSecret, method, path, data, params } = req.body;
  
  try {
    const response = await axios({
      method: method || 'GET',
      url: `${url}/wp-json/wc/v3${path}`,
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      data,
      params
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'WooCommerce API Error' });
  }
});

// Mock SEO/Competitor API (Integrating real SEO data would usually require a paid API like SerpApi)
app.post('/api/seo/analyze', async (req, res) => {
  const { niche, country } = req.body;
  // This would normally call a 3rd party API
  res.json({ 
    keywords: [`best ${niche} products`, `${niche} deals ${country}`, `buy ${niche} online`],
    score: 65,
    competitors: [`${niche}-expert.com`, `top-${niche}.io`]
  });
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
