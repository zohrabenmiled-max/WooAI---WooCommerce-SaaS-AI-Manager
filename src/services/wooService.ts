import { decrypt } from '../lib/crypto';

export interface WooCredentials {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export async function fetchWooData(site: any) {
  const url = site.url.endsWith('/') ? site.url.slice(0, -1) : site.url;
  const consumerKey = decrypt(site.consumerKeyEnc);
  const consumerSecret = decrypt(site.consumerSecretEnc);

  if (!consumerKey || !consumerSecret) {
    throw new Error('Identifiants API manquants ou invalides.');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  };

  try {
    const productsRes = await fetch(`${url}/wp-json/wc/v3/products?per_page=100`, { headers });
    if (!productsRes.ok) throw new Error(`Erreur API WooCommerce: ${productsRes.statusText}`);
    const products = await productsRes.json();

    const postsRes = await fetch(`${url}/wp-json/wp/v2/posts?per_page=50`, { headers });
    const posts = postsRes.ok ? await postsRes.json() : [];

    return { products, posts };
  } catch (error) {
    console.error('WooCommerce Sync Error:', error);
    throw error;
  }
}

// RESTORING ALL MISSING EXPORTS FOR OTHER COMPONENTS WITH CORRECT SIGNATURES
export const fetchProducts = async (creds: WooCredentials, params: any = {}) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const queryParams = new URLSearchParams({
    per_page: '100',
    orderby: 'id',
    order: 'desc',
    ...params
  }).toString();
  
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products?${queryParams}`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const getWooProducts = fetchProducts; // Alias for ProductManager

export const updateProduct = async (creds: WooCredentials, id: number, data: any, parentId?: number) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const path = parentId 
    ? `${creds.url}/wp-json/wc/v3/products/${parentId}/variations/${id}`
    : `${creds.url}/wp-json/wc/v3/products/${id}`;

  const res = await fetch(path, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
};

export const updateWooProductStock = async (creds: WooCredentials, id: number, stock: number) => 
  updateProduct(creds, id, { stock_quantity: stock });

export const updateWooProductPrice = async (creds: WooCredentials, id: number, price: string) => 
  updateProduct(creds, id, { sale_price: price });

export const fetchOrders = async (creds: WooCredentials) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/orders?per_page=100`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};

export const fetchCategories = async (creds: WooCredentials, params: any = {}) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const queryParams = new URLSearchParams({
    per_page: '100',
    ...params
  }).toString();

  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/categories?${queryParams}`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

export const getWooCategories = fetchCategories;

export const fetchTags = async (creds: WooCredentials, params: any = {}) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const queryParams = new URLSearchParams({
    per_page: '100',
    ...params
  }).toString();
  
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/tags?${queryParams}`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
};

export const fetchVariations = async (creds: WooCredentials, productId: number) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/${productId}/variations?per_page=100`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to fetch variations');
  return res.json();
};

export const deleteProduct = async (creds: WooCredentials, id: number, parentId?: number, force: boolean = true) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const path = parentId 
    ? `${creds.url}/wp-json/wc/v3/products/${parentId}/variations/${id}?force=${force}`
    : `${creds.url}/wp-json/wc/v3/products/${id}?force=${force}`;

  const res = await fetch(path, {
    method: 'DELETE',
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
};

export const createProduct = async (creds: WooCredentials, data: any) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
};

export const deleteCategory = async (creds: WooCredentials, id: number) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/categories/${id}?force=true`, {
    method: 'DELETE',
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
};

export const deleteTag = async (creds: WooCredentials, id: number) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/tags/${id}?force=true`, {
    method: 'DELETE',
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error('Failed to delete tag');
  return res.json();
};

export const updateCategory = async (creds: WooCredentials, id: number, data: any) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/categories/${id}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
};

export const updateTag = async (creds: WooCredentials, id: number, data: any) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/tags/${id}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update tag');
  return res.json();
};

export const createCategory = async (creds: WooCredentials, data: any) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/categories`, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
};

export const createTag = async (creds: WooCredentials, data: any) => {
  const auth = btoa(`${creds.consumerKey}:${creds.consumerSecret}`);
  const res = await fetch(`${creds.url}/wp-json/wc/v3/products/tags`, {
    method: 'POST',
    headers: { 
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create tag');
  return res.json();
};
