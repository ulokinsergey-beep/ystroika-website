/**
 * API endpoint: POST /api/catalog/prices
 * Body: { kods: string[] }  — массив кодов товаров (до 150)
 * Returns: { prices: { [kod]: { price: number, discounted_price: number } } }
 *
 * Прокси к КровАльянс /price — скрывает авторизацию на сервере.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { fetchPricesBatched } from '../../../lib/kroval';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const kods: string[] = Array.isArray(body?.kods) ? body.kods.slice(0, 150) : [];

    if (kods.length === 0) {
      return new Response(JSON.stringify({ prices: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const priceItems = await fetchPricesBatched(kods);

    const prices: Record<string, { price: number; discounted_price: number }> = {};
    for (const item of priceItems) {
      prices[item.kod] = {
        price: item.price,
        discounted_price: item.discounted_price,
      };
    }

    return new Response(JSON.stringify({ prices }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 минут кэш
      },
    });
  } catch (e: any) {
    console.error('[api/catalog/prices]', e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? 'Server error', prices: {} }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
