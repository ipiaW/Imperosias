import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products = getProducts();

    if (category && category !== 'ALL') {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.publisher.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
