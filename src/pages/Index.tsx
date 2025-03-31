
import SnakeGame from "@/components/SnakeGame";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white py-8">
      <h1 className="text-3xl font-bold mb-6">Snake Hunt Adventure</h1>
      <SnakeGame />
    </div>
  );
};

export default Index;
