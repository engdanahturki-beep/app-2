import { useState, useEffect, useRef } from "react";
import type { Level, Violation } from "./data/gameData";
import { levels } from "./data/gameData";
import { Shield, Clock, Eye, Trophy, ArrowLeft, RotateCcw, AlertTriangle, CheckCircle, XCircle, Play, Home, Star } from "lucide-react";

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  type: "success" | "fail";
}

export default function App() {
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [foundViolations, setFoundViolations] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [showViolation, setShowViolation] = useState<Violation | null>(null);
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  useEffect(() => {
    if (gameStatus === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameStatus("lost");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Check win condition
  useEffect(() => {
    if (currentLevel && gameStatus === "playing") {
      if (foundViolations.length === currentLevel.violations.length) {
        setGameStatus("won");
        const timeBonus = Math.floor(timeLeft * 10);
        const levelScore = score + timeBonus;
        setTotalScore((prev) => prev + levelScore);
        setCompletedLevels((prev) => [...prev, currentLevel.id]);
      }
    }
  }, [foundViolations, currentLevel, gameStatus, timeLeft, score]);

  const startLevel = (level: Level) => {
    setCurrentLevel(level);
    setFoundViolations([]);
    setScore(0);
    setTimeLeft(level.timeLimit);
    setGameStatus("playing");
    setShowViolation(null);
    setClickEffects([]);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (gameStatus !== "playing" || !currentLevel || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Check if click is inside any unfound violation
    const hit = currentLevel.violations.find((v) => {
      if (foundViolations.includes(v.id)) return false;
      return x >= v.x && x <= v.x + v.width && y >= v.y && y <= v.y + v.height;
    });

    if (hit) {
      setFoundViolations((prev) => [...prev, hit.id]);
      setScore((prev) => prev + 100);
      setShowViolation(hit);
      setClickEffects((prev) => [
        ...prev,
        { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top, type: "success" },
      ]);
    } else {
      setScore((prev) => Math.max(0, prev - 10));
      setClickEffects((prev) => [
        ...prev,
        { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top, type: "fail" },
      ]);
    }
  };

  const goHome = () => {
    setCurrentLevel(null);
    setGameStatus("idle");
    setShowViolation(null);
    setClickEffects([]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Home screen
  if (!currentLevel || gameStatus === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 text-teal-950 font-sans" dir="rtl">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg border-4 border-teal-400 mb-3 overflow-hidden">
              <img src="/logo.png" alt="الشعار" className="w-16 h-16 object-contain" />
            </div>
            <div className="text-teal-700 font-bold text-sm tracking-wide mb-2">فرصتك هنا</div>
            <h1 className="text-4xl font-extrabold text-teal-950 mb-2">يوم السلامة والصحة المهنية</h1>
            <p className="text-lg text-teal-700">28 أبريل — اختبر قدراتك في اكتشاف مخالفات السلامة!</p>
          </header>

          {/* Total score */}
          {totalScore > 0 && (
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-xl shadow-md px-6 py-3 flex items-center gap-3 border border-teal-200">
                <Trophy className="text-amber-500" />
                <span className="font-bold text-lg text-teal-900">مجموع النقاط: {totalScore}</span>
              </div>
            </div>
          )}

          {/* Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => {
              const isCompleted = completedLevels.includes(level.id);
              return (
                <div
                  key={level.id}
                  className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                    isCompleted ? "border-emerald-400" : "border-teal-100"
                  }`}
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={level.image}
                      alt={level.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-teal-950">{level.name}</h3>
                      {isCompleted && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={14} /> مكتمل
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-teal-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye size={16} /> {level.violations.length} مخالفات
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {formatTime(level.timeLimit)}
                      </span>
                    </div>
                    <button
                      onClick={() => startLevel(level)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw size={18} /> إعادة المحاولة
                        </>
                      ) : (
                        <>
                          <Play size={18} /> ابدأ اللعب
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="mt-12 bg-white rounded-2xl shadow-md p-6 text-center border border-teal-100">
            <h2 className="text-xl font-bold text-teal-900 mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="text-amber-500" />
              كيف تلعب؟
            </h2>
            <p className="text-teal-700 leading-relaxed max-w-2xl mx-auto">
              انقر على الأماكن التي ترى فيها مخالفات للسلامة داخل الصورة. كلما وجدت المخالفة بشكل أسرع، حصلت على نقاط أكثر! احرص على إيجاد جميع المخالفات قبل انتهاء الوقت.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-teal-50 text-teal-950 font-sans" dir="rtl">
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-teal-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goHome}
              className="flex items-center gap-1 text-teal-700 hover:text-teal-950 font-medium"
            >
              <ArrowLeft size={20} />
              <span>رجوع</span>
            </button>
            <div className="h-6 w-px bg-teal-300" />
            <h2 className="text-lg font-bold text-teal-950">{currentLevel.name}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-teal-100 px-3 py-1.5 rounded-lg">
              <Eye size={18} className="text-teal-700" />
              <span className="font-bold text-teal-900">
                {foundViolations.length} / {currentLevel.violations.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold ${
              timeLeft <= 10 ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-900"
            }`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-lg text-amber-800 font-bold">
              <Star size={18} />
              {score}
            </div>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden select-none border border-teal-100">
          <div className="relative">
            <img
              ref={imageRef}
              src={currentLevel.image}
              alt={currentLevel.name}
              className="w-full h-auto cursor-crosshair block"
              onClick={handleImageClick}
              draggable={false}
            />

            {/* Found violation markers */}
            {currentLevel.violations
              .filter((v) => foundViolations.includes(v.id))
              .map((v) => (
                <div
                  key={v.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${v.x * 100}%`,
                    top: `${v.y * 100}%`,
                    width: `${v.width * 100}%`,
                    height: `${v.height * 100}%`,
                  }}
                >
                  <div className="w-full h-full border-4 border-emerald-500 rounded-xl bg-emerald-500/10 animate-pulse flex items-center justify-center">
                    <CheckCircle className="text-emerald-600" size={32} />
                  </div>
                </div>
              ))}

            {/* Click effects */}
            {clickEffects.map((effect) => (
              <div
                key={effect.id}
                className="absolute pointer-events-none"
                style={{
                  left: effect.x - 20,
                  top: effect.y - 20,
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center animate-bounce ${
                    effect.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {effect.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Violation descriptions sidebar for found items */}
        {foundViolations.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-md p-5 border border-teal-100">
            <h3 className="text-lg font-bold text-teal-900 mb-3 flex items-center gap-2">
              <Shield className="text-emerald-600" size={20} />
              المخالفات المكتشفة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentLevel.violations
                .filter((v) => foundViolations.includes(v.id))
                .map((v) => (
                  <div key={v.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                    <div className="text-2xl">{v.icon}</div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">{v.title}</h4>
                      <p className="text-emerald-800 text-xs mt-1 leading-relaxed">{v.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Violation found modal */}
      {showViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in duration-200 border-2 border-teal-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl">
              {showViolation.icon}
            </div>
            <h3 className="text-xl font-bold text-teal-950 mb-2">{showViolation.title}</h3>
            <p className="text-teal-700 mb-6 leading-relaxed">{showViolation.description}</p>
            <div className="flex items-center justify-center gap-2 text-amber-600 font-bold mb-4">
              <Star size={20} />
              <span>+100 نقطة!</span>
            </div>
            <button
              onClick={() => setShowViolation(null)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md"
            >
              استمر
            </button>
          </div>
        </div>
      )}

      {/* Win screen */}
      {gameStatus === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-2 border-emerald-300">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Trophy size={48} />
            </div>
            <h2 className="text-2xl font-extrabold text-teal-950 mb-2">مبروك! اكتشفت كل المخالفات</h2>
            <p className="text-teal-700 mb-4">
              أنهيت مستوى <strong>{currentLevel.name}</strong> بنجاح
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="text-sm text-teal-600">الوقت المتبقي</div>
                <div className="font-bold text-teal-900">{formatTime(timeLeft)}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="text-sm text-amber-600">نقاط اللعبة</div>
                <div className="font-bold text-amber-700">{score}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-sm text-emerald-600">المجموع</div>
                <div className="font-bold text-emerald-700">{score + timeLeft * 10}</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={goHome}
                className="bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Home size={18} /> القائمة الرئيسية
              </button>
              {currentLevel.id < levels.length && (
                <button
                  onClick={() => startLevel(levels[currentLevel.id])}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-md"
                >
                  <Play size={18} /> المستوى التالي
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lose screen */}
      {gameStatus === "lost" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-2 border-red-200">
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-teal-950 mb-2">انتهى الوقت!</h2>
            <p className="text-teal-700 mb-6">
              لم تكتشف جميع المخالفات في <strong>{currentLevel.name}</strong>.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={goHome}
                className="bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Home size={18} /> القائمة الرئيسية
              </button>
              <button
                onClick={() => startLevel(currentLevel)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-md"
              >
                <RotateCcw size={18} /> حاول مرة أخرى
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
