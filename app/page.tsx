import ChatBox from "./components/ChatBox";

const Home = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-semibold text-center mb-6 text-black">Welcome to AI Tutor Chat</h1>
      <ChatBox />
    </div>
  );
};

export default Home;
