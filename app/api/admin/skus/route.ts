import { NextResponse } from 'next/server';
import { getAllProductsAdmin, updateSku, updateProduct } from '@/lib/db/store';

export async function GET() {
  try {
    const products = getAllProductsAdmin();
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, skuId, sellingPrice, baseCost, isAvailable, bonusText } = body;

    if (!productId || !skuId) {
      return NextResponse.json(
        { success: false, error: 'productId and skuId are required' },
        { status: 400 }
      );
    }

    const patch: any = {};
    if (typeof sellingPrice === 'number') patch.sellingPrice = sellingPrice;
    if (typeof baseCost === 'number') patch.baseCost = baseCost;
    if (typeof isAvailable === 'boolean') patch.isAvailable = isAvailable;
    if (typeof bonusText === 'string') patch.bonusText = bonusText;

    const updated = updateSku(productId, skuId, patch);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Product or SKU not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'SKU updated successfully'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update SKU' },
      { status: 500 }
    );
  }
}
