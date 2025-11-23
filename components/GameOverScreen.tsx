
import React, { useEffect, useState } from 'react';
import { GameStats } from '../types';
import { generateAdventureLog } from '../services/geminiService';
import { playGameOverSound } from '../services/audioService';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart }) => {
  const [log, setLog] = useState<string>("Consulting the Forest Spirit...");
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    playGameOverSound();

    let mounted = true;
    generateAdventureLog(stats).then(text => {
      if (mounted) {
        setLog(text);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = () => {
    const text = `I scored ${stats.score} points in Mushroom Rush! 🍄 Try to beat me: ${window.location.href}`;
    navigator.clipboard.writeText(text).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }).catch(() => {
      alert("Could not access clipboard. Copy the URL manually!");
    });
  };

  return (
    <div className="relative bg-white/95 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border-4 border-green-800">
       {/* QR Code Modal */}
      {showQRCode && (
        <div className="absolute inset-0 bg-black/90 rounded-xl z-50 flex flex-col items-center justify-center animate-fade-in p-4" onClick={() => setShowQRCode(false)}>
          <div className="bg-white p-4 rounded-xl shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <p className="text-green-900 font-bold mb-2 font-pixel text-lg">Scan to Play</p>
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`} 
               alt="QR Code" 
               className="w-48 h-48 mb-2 border-2 border-green-100 rounded"
             />
             <p className="text-xs text-gray-500 mb-3">Send to WeChat Friends</p>
             <button 
               onClick={() => setShowQRCode(false)}
               className="text-sm text-red-500 font-bold hover:underline"
             >
               Close
             </button>
          </div>
        </div>
      )}

      <h2 className="text-4xl font-pixel text-green-900 mb-4">Adventure Complete!</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-3 rounded-lg border-2 border-green-200">
          <div className="text-sm text-green-700 uppercase font-bold">Total Score</div>
          <div className="text-3xl font-pixel text-green-900">{stats.score}</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg border-2 border-yellow-200">
          <div className="text-sm text-yellow-700 uppercase font-bold">Golden</div>
          <div className="text-3xl font-pixel text-yellow-900">{stats.goldenCount}</div>
        </div>
      </div>

      <div className="mb-8 text-left bg-gray-50 p-6 rounded-xl border border-gray-200 relative">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Forest Spirit Log</h3>
        {loading ? (
          <div className="flex items-center justify-center py-4 space-x-2 text-green-600">
             <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
             <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce delay-75"></div>
             <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce delay-150"></div>
          </div>
        ) : (
          <p className="text-lg font-serif italic text-gray-800 leading-relaxed">
            "{log}"
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-pixel text-2xl py-3 rounded-xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
        >
          PLAY AGAIN
        </button>
        
        <div className="flex gap-2">
           <button
            onClick={handleShare}
            className={`flex-1 font-pixel text-xl py-3 rounded-xl shadow border-2 transition-all flex items-center justify-center gap-2 ${
                shared 
                ? 'bg-green-100 text-green-700 border-green-300' 
                : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
            }`}
            >
            {shared ? (
                <span>COPIED!</span>
            ) : (
                <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                COPY LINK
                </>
            )}
            </button>
            
            <button
                onClick={() => setShowQRCode(true)}
                className="bg-[#07C160] hover:bg-[#06ad56] text-white px-4 rounded-xl border-b-4 border-[#058f47] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center"
                title="WeChat QR Code"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.5,13.5A1.5,1.5 0 1,0 7,12,1.5,1.5,0,0,0 8.5,13.5Zm7-5A1.5,1.5 0 1,0 14,7,1.5,1.5,0,0,0 15.5,8.5ZM9,18c0,3.09,3.68,5.73,8,5.73a10.16,10.16,0,0,0,3-.45l3.2,1.6a.56.56,0,0,0,.76-.57l-.46-2.73c2.06-1.48,3.18-3.27,3.18-5.14,0-4.23-5-7.77-10.68-7.77S5.32,12.14,5.32,16.37a6.64,6.64,0,0,0,.26,1.85ZM2.66,15.3l-.38,2.24a.46.46,0,0,0,.62.46l2.61-1.31a8.28,8.28,0,0,0,2.46.37c.09-2.78,3.2-5.15,7-5.15,4.31,0,7.63,2.92,7.63,6.13,0-.2,0-.4,0-.6C22.58,7.77,17.52,0,11.29,0S0,7.77,0,11.86c0,2.13,1.39,4.15,3.93,5.6Z"/>
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};
