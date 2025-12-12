import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PomodoroTimer() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work'); // 'work' = 25min, 'break' = 5min

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Notification sonore simple (bip système si possible ou juste arrêt)
      // Pour l'instant on arrête juste
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = () => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button
        className={`pomodoro-trigger ${isActive ? 'active' : ''}`}
        onClick={() => setIsActive(!isActive)}
        title="Minuteur Pomodoro"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </button>

      {isActive && createPortal(
        <div className="pomodoro-panel">
            <div className="pomodoro-header">
                <span className="pomodoro-mode">{mode === 'work' ? 'Concentration' : 'Pause'}</span>
                <button className="pomodoro-close" onClick={() => setIsActive(false)}>✕</button>
            </div>
            <div className="pomodoro-time">{formatTime(timeLeft)}</div>
            <div className="pomodoro-controls">
                <button onClick={toggleTimer} className={`pomodoro-btn ${isRunning ? 'pause' : 'play'}`}>
                    {isRunning ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                </button>
                <button onClick={resetTimer} className="pomodoro-btn reset" title="Réinitialiser">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                </button>
                <button onClick={switchMode} className="pomodoro-btn switch" title={mode === 'work' ? "Passer à la pause" : "Passer au travail"}>
                    {mode === 'work' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    )}
                </button>
            </div>
        </div>,
        document.body
      )}

      <style>{`
        .pomodoro-trigger {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          color: #333;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .pomodoro-trigger:hover {
          transform: scale(1.05);
          background: #f8f9fa;
        }

        .pomodoro-trigger.active {
          background: #ef4444; /* Red for Pomodoro */
          color: white;
          border-color: #ef4444;
        }

        .pomodoro-panel {
          position: fixed;
          bottom: 6rem;
          right: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          z-index: 2000;
          animation: slideUp 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05);
          min-width: 220px;
        }

        .pomodoro-header {
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .pomodoro-mode {
            font-weight: 600;
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .pomodoro-close {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            font-size: 1.2rem;
        }
        
        .pomodoro-close:hover {
            color: #ef4444;
        }

        .pomodoro-time {
            font-size: 3.5rem;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            color: #333;
            line-height: 1;
            font-family: 'Courier New', monospace;
        }

        .pomodoro-controls {
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
            align-items: center;
        }

        .pomodoro-btn {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .pomodoro-btn.play {
            background: #ef4444;
            color: white;
            width: 56px;
            height: 56px;
        }
        
        .pomodoro-btn.pause {
            background: #fef2f2;
            color: #ef4444;
            border: 2px solid #ef4444;
            width: 56px;
            height: 56px;
        }

        .pomodoro-btn.play:hover {
            background: #dc2626;
            transform: scale(1.05);
        }

        .pomodoro-btn.reset, .pomodoro-btn.switch {
            background: #f3f4f6;
            color: #6b7280;
            width: 40px;
            height: 40px;
        }

        .pomodoro-btn.reset:hover, .pomodoro-btn.switch:hover {
            background: #e5e7eb;
            color: #374151;
        }

      `}</style>
    </>
  );
}
