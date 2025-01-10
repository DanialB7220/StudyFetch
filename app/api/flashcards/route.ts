import { NextResponse } from 'next/server';
import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('Connecting to MongoDB...');
    await connectMongo();
    console.log('Connected to MongoDB');

    // Fetch only the topic and _id from the flashcards
    const flashcardSets = await Flashcard.find({})
      .select('topic _id') // Only fetch the topic and _id fields
      .lean()
      .exec();

    console.log(`Found ${flashcardSets.length} flashcard sets`);
    return NextResponse.json({ flashcardSets }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch flashcard sets',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
