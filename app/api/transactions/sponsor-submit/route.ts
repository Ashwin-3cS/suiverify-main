import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Submit Sponsored Transaction
 *
 * This endpoint submits the user-signed transaction to Enoki for execution.
 * After the user signs the sponsored transaction bytes, this endpoint
 * sends the signature to Enoki to execute the transaction on-chain.
 *
 * Flow:
 * 1. Receive transaction digest and user signature from frontend
 * 2. Call Enoki sponsor submit API with PRIVATE key
 * 3. Return transaction result (digest)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { digest, signature } = body;

    // Validate required fields
    if (!digest) {
      return NextResponse.json(
        { error: 'Missing required field: digest' },
        { status: 400 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing required field: signature' },
        { status: 400 }
      );
    }

    // Get Enoki private API key from environment
    const enokiPrivateKey = process.env.ENOKI_PRIVATE_API_KEY;
    if (!enokiPrivateKey) {
      console.error('ENOKI_PRIVATE_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Enoki API key' },
        { status: 500 }
      );
    }

    // Prepare request to Enoki sponsor submit API
    const enokiUrl = `https://api.enoki.mystenlabs.com/v1/transaction-blocks/sponsor/${digest}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${enokiPrivateKey}`,
      'Content-Type': 'application/json',
    };

    const requestBody = {
      signature,
    };

    console.log('Submitting sponsored transaction to Enoki...');
    console.log('Digest:', digest);

    // Call Enoki sponsor submit API
    const response = await fetch(enokiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Enoki sponsor submit API error:', responseData);
      return NextResponse.json(
        {
          error: 'Failed to submit sponsored transaction',
          details: responseData
        },
        { status: response.status }
      );
    }

    console.log('Sponsored transaction submitted successfully');
    console.log('Transaction digest:', responseData.data.digest);

    // Return transaction result
    return NextResponse.json({
      success: true,
      data: {
        digest: responseData.data.digest,
      },
    });

  } catch (error) {
    console.error('Error in sponsor-submit API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
