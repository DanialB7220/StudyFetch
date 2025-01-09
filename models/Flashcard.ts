import mongoose, { Document, Schema } from 'mongoose';

interface IFlashcard {
  term: string;
  definition: string;
}

interface IFlashcardSet extends Document {
  topic: string;
  flashcards: IFlashcard[];
}

const flashcardSchema = new Schema<IFlashcardSet>({
  topic: {
    type: String,
    required: true,
  },
  flashcards: [
    {
      term: {
        type: String,
        required: true,
      },
      definition: {
        type: String,
        required: true,
      },
    },
  ],
});

const Flashcard = mongoose.models.Flashcard || mongoose.model<IFlashcardSet>('Flashcard', flashcardSchema);

export default Flashcard;
