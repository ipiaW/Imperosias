import { NextResponse } from 'next/server';
import { validateTargetAccount } from '@/lib/mock/aggregators';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productSlug, payload } = body;

    if (!productSlug || !payload) {
      return NextResponse.json(
        { success: false, error: 'productSlug and payload are required' },
        { status: 400 }
      );
    }

    const validationResult = await validateTargetAccount(productSlug, payload);

    return NextResponse.json({
      success: validationResult.isValid,
      data: validationResult,
      error: validationResult.errorMessage
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Account validation failed' },
      { status: 500 }
    );
  }
}
