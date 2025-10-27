import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type GameMode = 'classic' | 'timed' | 'endless' | null;
type GameState = 'menu' | 'playing' | 'finished';
type ColorName = 'красный' | 'синий' | 'зелёный' | 'жёлтый';

interface Round {
  word: ColorName;
  color: ColorName;
  startTime: number;
}

interface GameStats {
  correct: number;
  total: number;
  avgReactionTime: number;
  reactionTimes: number[];
}

interface BestScores {
  classic: { score: number; accuracy: number; avgTime: number } | null;
  timed: { score: number; accuracy: number; avgTime: number } | null;
  endless: { score: number; accuracy: number; avgTime: number } | null;
}

const COLORS: ColorName[] = ['красный', 'синий', 'зелёный', 'жёлтый'];
const COLOR_MAP: Record<ColorName, string> = {
  'красный': 'text-game-red',
  'синий': 'text-game-blue',
  'зелёный': 'text-game-green',
  'жёлтый': 'text-game-yellow'
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    total: 0,
    avgReactionTime: 0,
    reactionTimes: []
  });
  const [roundsLeft, setRoundsLeft] = useState(20);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [bestScores, setBestScores] = useState<BestScores>({
    classic: null,
    timed: null,
    endless: null
  });

  const generateRound = (): Round => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    let color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    while (Math.random() > 0.5 && color === word) {
      color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    
    return {
      word,
      color,
      startTime: Date.now()
    };
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('playing');
    setStats({ correct: 0, total: 0, avgReactionTime: 0, reactionTimes: [] });
    setFeedback(null);
    
    if (mode === 'classic') {
      setRoundsLeft(20);
    } else if (mode === 'timed') {
      setTimeLeft(60);
    }
    
    setCurrentRound(generateRound());
  };

  const handleAnswer = (selectedColor: ColorName) => {
    if (!currentRound || feedback) return;

    const reactionTime = Date.now() - currentRound.startTime;
    const isCorrect = selectedColor === currentRound.color;
    
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    const newReactionTimes = [...stats.reactionTimes, reactionTime];
    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1,
      reactionTimes: newReactionTimes,
      avgReactionTime: newReactionTimes.reduce((a, b) => a + b, 0) / newReactionTimes.length
    };
    
    setStats(newStats);

    setTimeout(() => {
      setFeedback(null);
      
      if (gameMode === 'classic') {
        if (roundsLeft <= 1) {
          finishGame(newStats);
          return;
        }
        setRoundsLeft(prev => prev - 1);
      }
      
      setCurrentRound(generateRound());
    }, 500);
  };

  const finishGame = (finalStats: GameStats) => {
    setGameState('finished');
    
    const accuracy = (finalStats.correct / finalStats.total) * 100;
    const score = finalStats.correct;
    
    if (gameMode) {
      const currentBest = bestScores[gameMode];
      if (!currentBest || score > currentBest.score) {
        setBestScores(prev => ({
          ...prev,
          [gameMode]: {
            score,
            accuracy,
            avgTime: finalStats.avgReactionTime
          }
        }));
        toast.success('Новый рекорд!', {
          description: `Правильных ответов: ${score}`
        });
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'timed') {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            finishGame(stats);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameState, gameMode, stats]);

  const resetGame = () => {
    setGameState('menu');
    setGameMode(null);
    setCurrentRound(null);
    setFeedback(null);
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-8">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4">Тест Струпа</h1>
            <p className="text-lg text-muted-foreground">
              Выберите цвет текста, а не то, что написано
            </p>
          </div>

          <Tabs defaultValue="play" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="play">Играть</TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
              <TabsTrigger value="rules">Правила</TabsTrigger>
            </TabsList>

            <TabsContent value="play" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('classic')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon name="Target" size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Классический</h3>
                    <p className="text-sm text-muted-foreground">20 раундов</p>
                    <Button className="w-full">Играть</Button>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('timed')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon name="Timer" size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">На время</h3>
                    <p className="text-sm text-muted-foreground">60 секунд</p>
                    <Button className="w-full">Играть</Button>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startGame('endless')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon name="Infinity" size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Бесконечный</h3>
                    <p className="text-sm text-muted-foreground">Без ограничений</p>
                    <Button className="w-full">Играть</Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {(['classic', 'timed', 'endless'] as const).map((mode) => {
                  const best = bestScores[mode];
                  const titles = { classic: 'Классический', timed: 'На время', endless: 'Бесконечный' };
                  
                  return (
                    <Card key={mode} className="p-6">
                      <h3 className="text-xl font-bold mb-4">{titles[mode]}</h3>
                      {best ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Правильно:</span>
                            <span className="font-semibold">{best.score}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Точность:</span>
                            <span className="font-semibold">{best.accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ср. время:</span>
                            <span className="font-semibold">{best.avgTime.toFixed(0)}мс</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center">Нет результатов</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Как играть?</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>1. На экране появится слово цвета, окрашенное в определённый цвет</p>
                  <p>2. Ваша задача — выбрать цвет текста, а не прочитать слово</p>
                  <p>3. Например: слово <span className="text-game-red font-bold">СИНИЙ</span> написано красным — правильный ответ: красный</p>
                  <p>4. Чем быстрее и точнее вы отвечаете, тем лучше результат</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Режимы игры</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>Классический:</strong> Пройдите 20 раундов и наберите максимум очков</p>
                  <p><strong>На время:</strong> Дайте максимум правильных ответов за 60 секунд</p>
                  <p><strong>Бесконечный:</strong> Тренируйтесь без ограничений</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  if (gameState === 'playing' && currentRound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={resetGame}>
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Выход
            </Button>
            
            <div className="text-center">
              {gameMode === 'classic' && (
                <div className="text-lg font-semibold">
                  Раундов: {roundsLeft} / 20
                </div>
              )}
              {gameMode === 'timed' && (
                <div className="text-lg font-semibold">
                  <Icon name="Timer" size={20} className="inline mr-1" />
                  {timeLeft}с
                </div>
              )}
            </div>

            <div className="text-lg font-semibold">
              {stats.correct} / {stats.total}
            </div>
          </div>

          {gameMode === 'classic' && (
            <Progress value={(stats.total / 20) * 100} className="h-2" />
          )}

          <Card className={`p-16 ${feedback === 'correct' ? 'animate-pulse-success' : feedback === 'wrong' ? 'animate-pulse-error' : ''}`}>
            <div className="text-center">
              <div className={`text-8xl font-bold mb-8 animate-fade-in ${COLOR_MAP[currentRound.color]}`}>
                {currentRound.word}
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {COLORS.map((color) => (
                  <Button
                    key={color}
                    size="lg"
                    variant="outline"
                    className={`text-lg h-16 font-semibold ${COLOR_MAP[color]} border-2 hover:scale-105 transition-transform`}
                    onClick={() => handleAnswer(color)}
                    disabled={!!feedback}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {gameMode === 'endless' && (
            <Card className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-game-green">{stats.correct}</div>
                  <div className="text-sm text-muted-foreground">Правильно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Всего</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgReactionTime.toFixed(0)}мс</div>
                  <div className="text-sm text-muted-foreground">Ср. время</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const accuracy = (stats.correct / stats.total) * 100;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Icon name="Trophy" size={40} className="text-primary" />
            </div>
            
            <h2 className="text-4xl font-bold">Игра завершена!</h2>
            
            <div className="grid grid-cols-3 gap-6 py-8">
              <div>
                <div className="text-4xl font-bold text-game-green mb-2">{stats.correct}</div>
                <div className="text-muted-foreground">Правильных</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">{accuracy.toFixed(1)}%</div>
                <div className="text-muted-foreground">Точность</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">{stats.avgReactionTime.toFixed(0)}</div>
                <div className="text-muted-foreground">мс среднее</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => gameMode && startGame(gameMode)}>
                <Icon name="RotateCcw" size={20} className="mr-2" />
                Ещё раз
              </Button>
              <Button size="lg" variant="outline" onClick={resetGame}>
                В меню
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default Index;
