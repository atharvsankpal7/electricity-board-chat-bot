import { NextResponse } from 'next/server';
import { analyzeConversation } from '@/lib/openai';
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    let analysis = await analyzeConversation(text);
    console.log('Analysis:', analysis);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
}