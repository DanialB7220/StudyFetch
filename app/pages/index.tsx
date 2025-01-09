import Link from 'next/link';  // Import Link component for navigation
import ChatBox from '../components/ChatBox';

const Home = () => {
  return (
    <div>
      {/* Make the "AI Tutor" text a clickable link that redirects to the homepage */}
      <h1 className="text-4xl font-bold text-center mb-6 text-black">
        <Link href="/" className="text-blue-600 hover:underline">
          AI Tutor Create flashacrds you can flip by clicking
        </Link>
      </h1>
      <ChatBox />
    </div>
  );
};

export default Home;
