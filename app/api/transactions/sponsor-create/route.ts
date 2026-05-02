import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * API Route: Create Sponsored Transaction
 *
 * This endpoint creates a sponsored transaction using Enoki's API.
 * The transaction gas fees will be paid by Enoki (sponsor) instead of the user.
 *
 * Flow:
 * 1. Receive transaction bytes from frontend (built with onlyTransactionKind: true)
 * 2. Call Enoki sponsor API with PRIVATE key
 * 3. Return sponsored transaction bytes and digest for user to sign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionBlockKindBytes, sender, jwtToken } = body;

    // Validate required fields
    if (!transactionBlockKindBytes) {
      return NextResponse.json(
        { error: 'Missing required field: transactionBlockKindBytes' },
        { status: 400 }
      );
    }

    if (!sender) {
      return NextResponse.json(
        { error: 'Missing required field: sender' },
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

    // Prepare request to Enoki sponsor API
    const enokiUrl = 'https://api.enoki.mystenlabs.com/v1/transaction-blocks/sponsor';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${enokiPrivateKey}`,
      'Content-Type': 'application/json',
    };

    // Optionally include zklogin-jwt header if provided
    if (jwtToken) {
      headers['zklogin-jwt'] = jwtToken;
    }

    // Extract allowedAddresses from request if provided
    const { allowedAddresses, allowedMoveCallTargets } = body;

    const requestBody = {
      transactionBlockKindBytes,
      network: 'testnet',
      sender,
      // Dynamic allowlist - addresses passed from frontend are allowed for this transaction
      ...(allowedAddresses && { allowedAddresses }),
      // Optional: Add allowed move call targets for additional security
      ...(allowedMoveCallTargets && { allowedMoveCallTargets }),
    };

    logger.log('Calling Enoki sponsor API...');
    logger.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Call Enoki sponsor API
    const response = await fetch(enokiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Enoki sponsor API error:');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(responseData, null, 2));

      // Extract error message from various possible formats
      let errorMessage = 'Unknown Enoki error';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        errorMessage = responseData.errors[0].message || responseData.errors[0];
      } else if (responseData.error) {
        errorMessage = responseData.error;
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }

      return NextResponse.json(
        {
          error: 'Failed to create sponsored transaction',
          details: responseData,
          status: response.status,
          enokiError: errorMessage
        },
        { status: response.status }
      );
    }

    logger.log('Sponsored transaction created successfully');
    logger.log('Digest:', responseData.data.digest);

    // Return sponsored transaction data
    return NextResponse.json({
      success: true,
      data: {
        digest: responseData.data.digest,
        bytes: responseData.data.bytes,
      },
    });

  } catch (error) {
    console.error('Error in sponsor-create API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
