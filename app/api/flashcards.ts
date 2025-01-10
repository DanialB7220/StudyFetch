import { NextApiRequest, NextApiResponse } from 'next';
import connectMongo from '../../utils/mongo';
import FlashcardSet from '../../models/Flashcard'; // MongoDB model for Flashcards

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectMongo();

  if (req.method === 'POST') {
    try {
      const { flashcards } = req.body;

      const flashcardSet = new FlashcardSet({
        topic: 'Generated Flashcards',
        flashcards,
      });

      await flashcardSet.save();
      res.status(200).json({ message: 'Flashcard set created successfully!' });
    } catch (error) {
      console.error('Error saving flashcard set:', error);
      res.status(500).json({ error: 'Failed to create flashcard set' });
    }
  } else if (req.method === 'GET') {
    try {
      console.log('Fetching all flashcard sets');
      const flashcardSets = await FlashcardSet.find();
      console.log('Fetched flashcard sets:', flashcardSets);
      res.status(200).json({ flashcardSets });
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
      res.status(500).json({ error: 'Failed to fetch flashcard sets' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

