import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Just log the data without throwing errors
    console.log('Auth log:', data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't throw errors for logging endpoints
    console.error('Auth log error:', error);
    return NextResponse.json({ success: false });
  }
}
