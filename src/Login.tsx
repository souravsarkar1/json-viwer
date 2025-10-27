import React, { useState, useRef, useEffect } from 'react';

interface ButtonPosition {
  x: number;
  y: number;
}

const CreativeJsonLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>({ x: 0, y: 0 });
  const [isButtonRunning, setIsButtonRunning] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>('Login');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const correctEmail = 'sourav.sarkar@klipit.co';
  const correctPassword = 'Klipit@1234';

  // Check if credentials are correct
  const isCredentialsCorrect = email === correctEmail && password === correctPassword;

  // Funny button texts when running away
  const runningTexts = [
    "Nope! 🏃‍♂️",
    "Not today! 😏",
    "Wrong! Try again 🤪",
    "Catch me! 🎯",
    "Invalid! 🚫",
    "Nice try! 😜",
    "Keep trying! 🎮",
    "Almost! 🎪",
    "Focus! 🎯",
    "JSON needs auth! 📝"
  ];

  // Generate random position within container bounds
  const getRandomPosition = (): ButtonPosition => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const container = containerRef.current.getBoundingClientRect();
    const buttonWidth = 200;
    const buttonHeight = 50;
    
    const maxX = container.width - buttonWidth - 20;
    const maxY = container.height - buttonHeight - 20;
    
    return {
      x: Math.random() * maxX,
      y: Math.random() * maxY
    };
  };

  // Move button to random position
  const moveButton = () => {
    const newPosition = getRandomPosition();
    setButtonPosition(newPosition);
    setIsButtonRunning(true);
    setAttempts(prev => prev + 1);
    
    // Change button text randomly
    const randomText = runningTexts[Math.floor(Math.random() * runningTexts.length)];
    setButtonText(randomText);
    
    // Reset button text after animation
    setTimeout(() => {
      setIsButtonRunning(false);
      setButtonText('Login');
    }, 1000);

    // Show hint after 5 attempts
    if (attempts >= 4) {
      setShowHint(true);
    }
  };

  // Handle login attempt
  const handleLogin = async () => {
    if (!isCredentialsCorrect) {
      moveButton();
      return;
    }

    setIsLoading(true);
    setButtonText('Processing JSON Magic... 🪄');
    
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('🎉 Welcome to JSON Tree Visualizer! Login Successful! 🌳');
    setIsLoading(false);
  };

  // Initialize button position
  useEffect(() => {
    setButtonPosition({ x: 0, y: 0 });
  }, []);

  // Generate floating JSON elements
  const jsonElements = ['{ }', '[ ]', '"key"', 'null', 'true', '42', '🌳', '📝', '🔍', '⚡'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {jsonElements.map((element, index) => (
          <div
            key={index}
            className={`absolute text-white/20 font-mono text-2xl animate-bounce`}
            style={{
              left: `${(index * 12) % 100}%`,
              top: `${(index * 17) % 100}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${3 + (index % 3)}s`
            }}
          >
            {element}
          </div>
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="relative z-10 min-h-screen flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-pulse">🌳</div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-2">
              JSON Tree Visualizer
            </h1>
            <p className="text-cyan-300 animate-pulse">Parse • Visualize • Explore</p>
            
            {/* Attempt Counter */}
            {attempts > 0 && (
              <div className="mt-4 text-red-400 animate-bounce">
                Failed Attempts: {attempts} 😅
              </div>
            )}
          </div>

          {/* Login Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-3xl p-8 shadow-2xl relative">
            {/* Card Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 animate-pulse rounded-3xl"></div>
            
            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 text-yellow-400 text-2xl animate-spin">⚡</div>
            <div className="absolute top-4 right-4 text-cyan-400 text-2xl animate-bounce">🔍</div>
            <div className="absolute bottom-4 left-4 text-pink-400 text-2xl animate-pulse">📊</div>
            <div className="absolute bottom-4 right-4 text-purple-400 text-2xl animate-ping">🎯</div>

            <div className="relative z-10">
              {/* Welcome */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back, JSON Master!</h3>
                <p className="text-cyan-200">Ready to parse some trees? 🌲</p>
              </div>

              {/* Hint Box */}
              {showHint && (
                <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400/50 rounded-xl text-yellow-200 text-sm animate-pulse">
                  <div className="font-semibold mb-1">🔥 Pro Tip:</div>
                  <div>Email starts with "sourav"</div>
                  <div>Password contains "Klipit" 😉</div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-6">
                {/* Email Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-cyan-400 text-xl">📧</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className={`w-full pl-12 pr-4 py-4 bg-white/20 border-2 rounded-2xl text-white placeholder-cyan-200 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                      email === correctEmail 
                        ? 'border-green-400 focus:border-green-400 focus:ring-green-400/50' 
                        : 'border-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/50'
                    }`}
                  />
                  {email === correctEmail && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-green-400 text-xl animate-bounce">✅</span>
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-400 text-xl">🔐</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className={`w-full pl-12 pr-12 py-4 bg-white/20 border-2 rounded-2xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                      password === correctPassword 
                        ? 'border-green-400 focus:border-green-400 focus:ring-green-400/50' 
                        : 'border-purple-400/30 focus:border-purple-400 focus:ring-purple-400/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-purple-100 transition-colors"
                  >
                    <span className="text-xl">{showPassword ? '🙈' : '👁️'}</span>
                  </button>
                  {password === correctPassword && (
                    <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                      <span className="text-green-400 text-xl animate-bounce">✅</span>
                    </div>
                  )}
                </div>

                {/* Credentials Status */}
                <div className="text-center text-sm">
                  {isCredentialsCorrect ? (
                    <div className="text-green-400 animate-pulse">
                      🎉 Perfect! Now you can login! 🎉
                    </div>
                  ) : (
                    <div className="text-yellow-400">
                      {email && password ? '❌ Invalid credentials!' : '⏳ Enter your credentials...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Running Login Button */}
              <div className="mt-8 relative h-16">
                <button
                  ref={buttonRef}
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={`absolute w-48 h-12 font-bold rounded-2xl transition-all duration-500 transform ${
                    isCredentialsCorrect
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-lg hover:shadow-green-500/50'
                      : isButtonRunning
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse scale-110'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:scale-105 cursor-pointer'
                  } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  style={{
                    left: buttonPosition.x,
                    top: buttonPosition.y,
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Parsing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>{buttonText}</span>
                      {!isCredentialsCorrect && !isButtonRunning && <span className="animate-bounce">🏃‍♂️</span>}
                      {isCredentialsCorrect && <span className="animate-bounce">🚀</span>}
                    </div>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-12 text-center text-xs text-cyan-300 opacity-70">
                <p>💡 Tip: The login button has a mind of its own!</p>
                <p>🎯 Enter the correct credentials to tame it!</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <div className="text-cyan-300 text-sm animate-pulse">
              🌳 "Every JSON tree has its roots in proper authentication" 🌳
            </div>
            <div className="text-xs mt-2 opacity-70 text-purple-300">
              Powered by Mischievous UI Magic ✨
            </div>
          </div>
        </div>
      </div>

      {/* Easter Egg - JSON Rain */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-green-400/30 font-mono text-sm animate-pulse"
            style={{
              left: `${(i * 10) % 100}%`,
              top: `-10%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: '10s',
              animationIterationCount: 'infinite',
              animation: `fall 10s linear infinite ${i * 0.8}s`
            }}
          >
            {jsonElements[i % jsonElements.length]}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CreativeJsonLoginPage;