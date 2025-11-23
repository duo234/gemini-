
import React, { ChangeEvent, useEffect, useState } from 'react';
import { initAudio } from '../services/audioService';

interface WelcomeScreenProps {
  onStart: (img: HTMLImageElement | null) => void;
}

// A cute pixel art mushroom hunter generated as an SVG Data URI
const DEFAULT_CHAR_SVG = `
<svg width="64" height="64" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <rect x="4" y="1" width="8" height="2" fill="#ef4444"/>
  <rect x="2" y="3" width="12" height="3" fill="#ef4444"/>
  <rect x="3" y="2" width="1" height="1" fill="white"/>
  <rect x="11" y="2" width="1" height="1" fill="white"/>
  <rect x="5" y="4" width="2" height="1" fill="white"/>
  <rect x="10" y="4" width="1" height="1" fill="white"/>
  <rect x="4" y="6" width="8" height="4" fill="#ffedd5"/>
  <rect x="5" y="7" width="1" height="2" fill="#1f2937"/>
  <rect x="10" y="7" width="1" height="2" fill="#1f2937"/>
  <rect x="5" y="10" width="6" height="4" fill="#3b82f6"/>
  <rect x="5" y="10" width="1" height="4" fill="#2563eb"/>
  <rect x="10" y="10" width="1" height="4" fill="#2563eb"/>
  <rect x="4" y="14" width="3" height="2" fill="#451a03"/>
  <rect x="9" y="14" width="3" height="2" fill="#451a03"/>
</svg>
`.trim();

const DEFAULT_CHAR_SRC = `data:image/svg+xml;base64,${btoa(DEFAULT_CHAR_SVG)}`;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Load default character on mount
  useEffect(() => {
    loadDefaultChar();
  }, []);

  const loadDefaultChar = () => {
    const img = new Image();
    img.src = DEFAULT_CHAR_SRC;
    img.onload = () => {
      setImgElement(img);
      setPreview(DEFAULT_CHAR_SRC);
    };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = evt.target?.result as string;
        
        const img = new Image();
        img.src = res;
        img.onload = () => {
          setImgElement(img);
          setPreview(res);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStart = () => {
    initAudio();
    onStart(imgElement);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyFeedback("Link Copied!");
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      setCopyFeedback("Copy URL manually");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  return (
    <div className="relative bg-white/95 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-green-800 animate-fade-in">
      {/* Share Controls */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button 
          onClick={() => setShowQRCode(true)}
          className="text-white bg-[#07C160] hover:bg-[#06ad56] p-2 rounded-full transition-all shadow-sm"
          title="WeChat / QR Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5,13.5A1.5,1.5 0 1,0 7,12,1.5,1.5,0,0,0 8.5,13.5Zm7-5A1.5,1.5 0 1,0 14,7,1.5,1.5,0,0,0 15.5,8.5ZM9,18c0,3.09,3.68,5.73,8,5.73a10.16,10.16,0,0,0,3-.45l3.2,1.6a.56.56,0,0,0,.76-.57l-.46-2.73c2.06-1.48,3.18-3.27,3.18-5.14,0-4.23-5-7.77-10.68-7.77S5.32,12.14,5.32,16.37a6.64,6.64,0,0,0,.26,1.85ZM2.66,15.3l-.38,2.24a.46.46,0,0,0,.62.46l2.61-1.31a8.28,8.28,0,0,0,2.46.37c.09-2.78,3.2-5.15,7-5.15,4.31,0,7.63,2.92,7.63,6.13,0-.2,0-.4,0-.6C22.58,7.77,17.52,0,11.29,0S0,7.77,0,11.86c0,2.13,1.39,4.15,3.93,5.6Z"/>
          </svg>
        </button>
        <button 
          onClick={handleShare}
          className="text-green-700 bg-green-100 hover:bg-green-200 p-2 rounded-full transition-all"
          title="Copy Link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>

      {copyFeedback && (
        <div className="absolute top-2 right-16 bg-black/80 text-white text-xs px-2 py-1 rounded animate-fade-in z-50">
          {copyFeedback}
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="absolute inset-0 bg-black/90 rounded-2xl z-50 flex flex-col items-center justify-center animate-fade-in p-4" onClick={() => setShowQRCode(false)}>
          <div className="bg-white p-4 rounded-xl shadow-2xl text-center" onClick={e => e.stopPropagation()}>
             <p className="text-green-900 font-bold mb-2 font-pixel text-lg">Scan via WeChat</p>
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`} 
               alt="QR Code" 
               className="w-48 h-48 mb-2 border-2 border-green-100 rounded"
             />
             <p className="text-xs text-gray-500 mb-3">Share with friends!</p>
             <button 
               onClick={() => setShowQRCode(false)}
               className="text-sm text-red-500 font-bold hover:underline"
             >
               Close
             </button>
          </div>
        </div>
      )}

      <h1 className="text-5xl font-pixel text-green-900 mb-2 mt-4">Mushroom Rush</h1>
      <p className="text-gray-600 mb-6 font-pixel text-xl">Help the Forest Kid collect mushrooms!</p>
      
      <div className="mb-6 flex flex-col items-center">
        <div className="relative group">
          <label className="w-32 h-32 border-4 border-dashed border-green-400 rounded-xl flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors overflow-hidden bg-green-50/50">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Character" className="w-full h-full object-contain image-pixelated" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="text-green-500 text-center p-2">
                <span className="text-xs font-bold uppercase">Loading...</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-bold">Change Skin</span>
            </div>
          </label>
        </div>

        {preview !== DEFAULT_CHAR_SRC && (
          <button 
            onClick={loadDefaultChar}
            className="text-xs text-green-600 underline mt-2 hover:text-green-800"
          >
            Reset to Default Hero
          </button>
        )}
      </div>

      <button
        onClick={handleStart}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-pixel text-2xl py-3 rounded-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all mb-4"
      >
        START ADVENTURE
      </button>

      <div className="text-sm text-gray-600 bg-orange-50 p-4 rounded-lg border border-orange-200 text-left">
        <p className="font-bold font-pixel text-lg mb-2 text-orange-900">How to play:</p>
        <ul className="space-y-2 font-mono text-xs">
          <li className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-sm mr-2 block"></span> 
            Collect Red Mushrooms <span className="font-bold text-green-700 ml-auto">+10 pts</span>
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-yellow-400 rounded-sm mr-2 block"></span> 
            Find Golden Mushrooms <span className="font-bold text-green-700 ml-auto">+50 pts</span>
          </li>
          <li className="flex items-center">
            <span className="w-3 h-3 bg-purple-600 rounded-sm mr-2 block"></span> 
            Avoid Poison Mushrooms <span className="font-bold text-red-700 ml-auto">-20 pts</span>
          </li>
        </ul>
        <div className="mt-3 text-center text-xs text-gray-400">
          Use Arrow Keys or Touch Controls
        </div>
      </div>
    </div>
  );
};
