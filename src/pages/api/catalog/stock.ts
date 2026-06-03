/**
 * API endpoint: POST /api/catalog/stock
 * Body: { kods: string[] }  — массив кодов товаров (до 150)
 * Returns: { stock: { [kod]: number } }  — количество на складе
 *
 * Прокси к КровАльянс /exchange — скрывает авторизацию на сервере.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { fetchStock } from '../../../lib/kroval';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const kods: string[] = Array.isArray(body?.kods) ? body.kods.slice(0, 150) : [];

    if (kods.length === 0) {
      return new Response(JSON.stringify({ stock: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stockData = await fetchStock(kods);

    return new Response(JSON.stringify({ stock: stockData }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120', // 2 минуты кэш (остаток меняется чаще)
      },
    });
  } catch (e: any) {
    console.error('[api/catalog/stock]', e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? 'Server error', stock: {} }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
