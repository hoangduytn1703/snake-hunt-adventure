
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;

// Direction enum
enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// Cell type
type Cell = {
  x: number;
  y: number;
};

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Cell[]>([{ x: 8, y: 8 }]);
  const [food, setFood] = useState<Cell>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const { toast } = useToast();
  const directionRef = useRef(direction);

  // Place food in a random position that's not occupied by the snake
  const placeFood = useCallback(() => {
    const newFood: Cell = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    // If the new food position is occupied by the snake, try again
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return placeFood();
    }

    setFood(newFood);
  }, [snake]);

  // Update direction based on key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentDir = directionRef.current;

    switch (e.key) {
      case 'ArrowUp':
        if (currentDir !== Direction.DOWN) {
          setDirection(Direction.UP);
          directionRef.current = Direction.UP;
        }
        break;
      case 'ArrowDown':
        if (currentDir !== Direction.UP) {
          setDirection(Direction.DOWN);
          directionRef.current = Direction.DOWN;
        }
        break;
      case 'ArrowLeft':
        if (currentDir !== Direction.RIGHT) {
          setDirection(Direction.LEFT);
          directionRef.current = Direction.LEFT;
        }
        break;
      case 'ArrowRight':
        if (currentDir !== Direction.LEFT) {
          setDirection(Direction.RIGHT);
          directionRef.current = Direction.RIGHT;
        }
        break;
      case ' ':
        togglePause();
        break;
      default:
        break;
    }
  }, []);

  // Move snake one step in the current direction
  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      // Move the head according to the direction
      switch (directionRef.current) {
        case Direction.UP:
          head.y -= 1;
          break;
        case Direction.DOWN:
          head.y += 1;
          break;
        case Direction.LEFT:
          head.x -= 1;
          break;
        case Direction.RIGHT:
          head.x += 1;
          break;
      }

      // Check if game over (hit wall or itself)
      if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
      ) {
        setGameOver(true);
        toast({
          title: "Game Over!",
          description: `Your score: ${score}`,
        });
        return prevSnake;
      }

      // Create new snake body
      const newSnake = [head, ...prevSnake];
      
      // Check if snake ate food
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        placeFood();
        setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50)); // Increase speed
      } else {
        // Remove tail if no food eaten
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, gameStarted, food.x, food.y, placeFood, score, toast]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return;

    const gameLoop = () => {
      moveSnake();
      gameLoopRef.current = window.setTimeout(gameLoop, speed);
    };

    gameLoopRef.current = window.setTimeout(gameLoop, speed);

    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [gameStarted, isPaused, gameOver, moveSnake, speed]);

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Start a new game
  const startGame = () => {
    setSnake([{ x: 8, y: 8 }]);
    directionRef.current = Direction.RIGHT;
    setDirection(Direction.RIGHT);
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    placeFood();
    setGameStarted(true);
    setIsPaused(false);
  };

  // Toggle pause state
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Handle direction button clicks (for mobile)
  const handleDirectionButton = (newDirection: Direction) => {
    const currentDir = directionRef.current;
    
    // Prevent 180-degree turns
    if (
      (newDirection === Direction.UP && currentDir !== Direction.DOWN) ||
      (newDirection === Direction.DOWN && currentDir !== Direction.UP) ||
      (newDirection === Direction.LEFT && currentDir !== Direction.RIGHT) ||
      (newDirection === Direction.RIGHT && currentDir !== Direction.LEFT)
    ) {
      setDirection(newDirection);
      directionRef.current = newDirection;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <div className="text-2xl font-bold">Snake Hunt</div>
      
      <div className="flex items-center justify-between w-full max-w-md mb-2">
        <div className="text-lg font-semibold">Score: {score}</div>
        {gameStarted && !gameOver && (
          <Button 
            variant="outline" 
            onClick={togglePause}
            className="px-4 py-2"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        )}
      </div>

      <div 
        className="relative border-2 border-gray-800 bg-black"
        style={{ 
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Game board grid */}
        <div className="absolute inset-0 grid"
          style={{
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}`}
            className={`absolute rounded-sm ${index === 0 ? 'bg-green-400' : 'bg-green-600'}`}
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
              transition: 'all 0.1s linear',
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 6,
            height: CELL_SIZE - 6,
            left: food.x * CELL_SIZE + 3,
            top: food.y * CELL_SIZE + 3,
          }}
        />

        {/* Game over or initial overlay */}
        {(gameOver || !gameStarted) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
            {gameOver ? (
              <>
                <div className="text-xl text-white font-bold mb-2">Game Over!</div>
                <div className="text-white mb-4">Final Score: {score}</div>
              </>
            ) : (
              <div className="text-xl text-white font-bold mb-4">Snake Hunt</div>
            )}
            <Button onClick={startGame}>
              {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          </div>
        )}

        {/* Pause overlay */}
        {isPaused && gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-xl text-white font-bold">PAUSED</div>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
        <div className="col-start-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDirectionButton(Direction.UP)}
          >
            <ArrowUp size={24} />
          </Button>
        </div>
        <div className="col-start-1 row-start-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDirectionButton(Direction.LEFT)}
          >
            <ArrowLeft size={24} />
          </Button>
        </div>
        <div className="col-start-3 row-start-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDirectionButton(Direction.RIGHT)}
          >
            <ArrowRight size={24} />
          </Button>
        </div>
        <div className="col-start-2 row-start-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={togglePause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
        <div className="col-start-2 row-start-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDirectionButton(Direction.DOWN)}
          >
            <ArrowDown size={24} />
          </Button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Use arrow keys to move or the on-screen controls. Press space to pause.
      </div>
    </div>
  );
};

export default SnakeGame;
