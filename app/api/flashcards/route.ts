import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '@/utils/mongo';
import FlashcardSet from '@/models/Flashcard'; // MongoDB model for Flashcards
import { NextRequest, NextResponse } from 'next/server';


export const GET = async (req:NextRequest, ) => {
    try {
        console.log('Fetching all flashcard sets');
        const flashcardSets = await FlashcardSet.find();
        console.log('Fetched flashcard sets:', flashcardSets);
        return NextResponse.json({ flashcardSets } , { status: 200 });
    } catch (error) {
        console.error('Error fetching flashcard sets:', error);
        return NextResponse.json({ error } , { status: 400 });
    }
}