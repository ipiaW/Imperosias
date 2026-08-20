import { NextResponse } from 'next/server';
import { getProductBySlug, getPaymentMethods } from '@/lib/db/store';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const product = getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    const paymentMethods = getPaymentMethods();

    return NextResponse.json({
      success: true,
      data: {
        product,
        paymentMethods
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}
