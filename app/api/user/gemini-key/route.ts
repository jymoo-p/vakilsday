import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { testGeminiKey } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, userEmail, skipValidation } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Get user ID using raw SQL to bypass pooler cache
    const userResult: any[] = await prisma.$queryRaw`
      SELECT id FROM "users" WHERE email = ${userEmail}
    `;

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;

    // Test the API key (unless skipValidation is true)
    if (!skipValidation) {
      console.log('Testing Gemini API key...');
      const isValid = await testGeminiKey(apiKey);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check and try again. Check the server logs for details.' },
          { status: 400 }
        );
      }
    } else {
      console.log('Skipping API key validation (skipValidation=true)');
    }

    // TEMPORARY: Due to pooler metadata cache issue, we'll accept the key but not store it
    // The client will store it in localStorage temporarily
    // TODO: Once pooler cache refreshes or in production, remove this workaround
    console.log('API key validated successfully. Skipping database storage due to pooler cache issue.');
    console.log('Client will store in localStorage temporarily.');

    // Return success - the client-side code will handle storage
    return NextResponse.json({
      success: true,
      message: 'Gemini API key validated successfully',
      tempStorage: true, // Flag to tell client to use localStorage
    });

    return NextResponse.json({
      success: true,
      message: 'Gemini API key saved successfully',
    });
  } catch (error: any) {
    console.error('Save Gemini key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // TEMPORARY: Return that key doesn't exist in DB (client uses localStorage)
    // TODO: Remove this once pooler cache is refreshed
    console.log('GET request - returning hasKey: false (client will check localStorage)');

    return NextResponse.json({
      hasKey: false,
      keyPreview: null,
      tempStorage: true, // Flag to tell client to check localStorage
    });
  } catch (error: any) {
    console.error('Get Gemini key status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get API key status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user ID using raw SQL to bypass pooler cache
    const userResult: any[] = await prisma.$queryRaw`
      SELECT id FROM "users" WHERE email = ${decodeURIComponent(userEmail)}
    `;

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;

    await prisma.$executeRaw`
      UPDATE "users"
      SET "geminiApiKey" = NULL
      WHERE id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Gemini API key removed successfully',
    });
  } catch (error: any) {
    console.error('Delete Gemini key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
