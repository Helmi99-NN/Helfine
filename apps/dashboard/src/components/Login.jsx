import React, { useState, useRef, useEffect } from 'react';

export default function Login({ onAuthSuccess }) {
  const PIN_LENGTH = 6;
  const CORRECT_PIN = "159357";
  
  const [pin, setPin] = useState(new Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    
    setError(false);
    
    const newPin = [...pin];
    newPin[index] = element.value;
    setPin(newPin);

    // Focus next input
    if (element.value !== "" && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check PIN if all filled
    if (newPin.every(digit => digit !== "")) {
      const enteredPin = newPin.join("");
      if (enteredPin === CORRECT_PIN) {
        onAuthSuccess();
      } else {
        setError(true);
        // Reset after short delay
        setTimeout(() => {
          setPin(new Array(PIN_LENGTH).fill(""));
          setError(false);
          inputRefs.current[0].focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (pin[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, PIN_LENGTH).replace(/\D/g, '');
    if (pastedData) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      const nextFocus = pastedData.length < PIN_LENGTH ? pastedData.length : PIN_LENGTH - 1;
      inputRefs.current[nextFocus].focus();
      
      if (pastedData.length === PIN_LENGTH) {
        if (pastedData === CORRECT_PIN) {
          onAuthSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin(new Array(PIN_LENGTH).fill(""));
            setError(false);
            inputRefs.current[0].focus();
          }, 500);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="glass-card rounded-3xl p-10 md:p-14 flex flex-col items-center relative z-10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500">
        
        {/* Logo/Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] mb-8">
          <span className="material-symbols-outlined text-emerald-400 text-4xl">lock</span>
        </div>
        
        <h1 className="font-display-lg text-3xl text-white tracking-tight mb-2">Helfine</h1>
        <p className="text-slate-400 font-body-base mb-10 text-center">Masukkan PIN rahasia untuk mengakses dashboard finansial Anda.</p>
        
        {/* PIN Inputs */}
        <div 
          className={`flex gap-3 sm:gap-4 mb-4 transition-transform duration-300 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          onPaste={handlePaste}
        >
          {pin.map((data, index) => (
            <input
              key={index}
              type="password" // Use password to hide the actual numbers if desired, or text to show them. Let's use text for PIN so they see what they type. Wait, "password" hides it. Let's use text but mask it with CSS, or just "password".
              maxLength="1"
              ref={el => inputRefs.current[index] = el}
              value={data}
              onChange={e => handleChange(e.target, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              className={`w-12 h-14 sm:w-14 sm:h-16 bg-surface-container-lowest/50 border ${error ? 'border-error text-error' : 'border-outline-variant text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'} rounded-xl text-center text-2xl font-data-mono font-bold outline-none transition-all shadow-inner`}
            />
          ))}
        </div>
        
        {error ? (
          <p className="text-error font-label-sm text-sm h-5 animate-in fade-in">PIN salah. Silakan coba lagi.</p>
        ) : (
          <p className="text-transparent font-label-sm text-sm h-5">Placeholder</p>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
