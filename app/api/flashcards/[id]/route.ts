import connectMongo from '@/utils/mongo';
import Flashcard from '@/models/Flashcard'; // Import your Flashcard model
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, segments: any) {
  await connectMongo();

  const { id } = await segments.params;
  
  console.log('id:', id);
    
    try {
      // Fetch all flashcard sets from the database
      const flashcardSets = await Flashcard.findOne({ _id: id });
      console.log('id:', id);
      return NextResponse.json({ flashcardSets });
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
      return NextResponse.json({ error: 'Failed to fetch flashcard sets'}, { status: 500 });   

    }
  
}
