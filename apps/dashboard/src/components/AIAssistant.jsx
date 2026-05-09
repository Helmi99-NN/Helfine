import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

export default function AIAssistant({ financialData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(!localStorage.getItem('gemini_api_key'));
  const [inputKey, setInputKey] = useState(apiKey);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Halo! Saya Asisten Gemini AI. Saya memiliki akses ke ringkasan data keuangan Anda (saldo, pengeluaran makan, arus kas, jurnal trading). Ada yang bisa saya bantu hari ini?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const saveApiKey = () => {
    if (inputKey.trim()) {
      localStorage.setItem('gemini_api_key', inputKey.trim());
      setApiKey(inputKey.trim());
      setIsSettingsOpen(false);
    }
  };

  const removeApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setInputKey('');
    setIsSettingsOpen(true);
  };

  // Build context string from financialData
  const buildContext = () => {
    if (!financialData) return "Data keuangan tidak tersedia.";
    
    let context = "Berikut adalah ringkasan data keuangan pengguna saat ini:\n\n";
    
    // Accounts
    if (financialData.accounts) {
      context += "## SALDO AKUN\n";
      financialData.accounts.forEach(acc => {
        context += `- ${acc.name} (${acc.type}): Rp ${acc.value.toLocaleString('id-ID')}\n`;
      });
      context += `- Total Investasi: Rp ${financialData.totalInvestasi.toLocaleString('id-ID')}\n`;
      context += `- Total Tabungan: Rp ${financialData.totalTabungan.toLocaleString('id-ID')}\n`;
      context += `- Total Aset: Rp ${financialData.totalAssets.toLocaleString('id-ID')}\n\n`;
    }

    // Operational
    if (financialData.operationalWallets) {
      context += "## ALOKASI OPERASIONAL\n";
      financialData.operationalWallets.forEach(w => {
        const status = w.status || 'filled';
        if (status === 'filled') {
          context += `- ${w.name}: Rp ${w.value.toLocaleString('id-ID')}\n`;
        }
      });
      context += `- Total Saldo Operasional: Rp ${financialData.operationalBalance.toLocaleString('id-ID')}\n\n`;
    }

    // Makan (from localStorage)
    try {
      const makanTxs = JSON.parse(localStorage.getItem('makan_transactions') || '[]');
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentMakanTxs = makanTxs.filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear);
      const totalMakan = currentMakanTxs.reduce((sum, tx) => sum + tx.amount, 0);
      context += `## PENGELUARAN MAKAN BULAN INI\n`;
      context += `- Total: Rp ${totalMakan.toLocaleString('id-ID')} dari anggaran Rp 750.000\n\n`;
    } catch (e) {}

    // Trading (from localStorage)
    try {
      const trading = JSON.parse(localStorage.getItem('trading_journal') || '[]');
      if (trading.length > 0) {
        let win = 0;
        let loss = 0;
        let totalPL = 0;
        trading.forEach(t => {
          if (t.sell && t.sell > 0 && t.lot > 0) {
            const result = (t.sell - t.buy) * t.lot * 100;
            totalPL += result;
            if (result > 0) win++;
            else if (result < 0) loss++;
          }
        });
        context += `## RINGKASAN TRADING\n`;
        context += `- Total Profit/Loss: Rp ${totalPL.toLocaleString('id-ID')}\n`;
        context += `- Win: ${win}, Loss: ${loss}\n\n`;
      }
    } catch(e) {}

    context += "\nAnda adalah analis keuangan pribadi pengguna. Berikan saran yang singkat, ramah, dan solutif berdasarkan data di atas. Jangan menyebutkan bahwa Anda membaca data mentah, bersikaplah natural.";
    
    return context;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !apiKey) return;

    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
      
      const context = buildContext();
      
      const prompt = `
System Prompt (Konteks Internal):
${context}

Riwayat Percakapan:
${messages.map(m => `${m.role === 'user' ? 'Pengguna' : 'Asisten'}: ${m.text}`).join('\n')}

Pengguna: ${userMessage.text}
Asisten:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMsg = `Maaf, terjadi kesalahan: ${error.message}`;
      
      if (error.message && error.message.toLowerCase().includes('api key')) {
        errorMsg = "API Key tidak valid atau salah. Silakan periksa kembali API Key di pengaturan (ikon ⚙️).";
        removeApiKey();
      } else if (error.message && error.message.includes('404')) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const data = await res.json();
          if (data.models) {
            const modelNames = data.models.map(m => m.name.replace('models/', '')).filter(n => n.includes('gemini')).join(', ');
            errorMsg = `Error 404: Model tidak ditemukan. Namun API Key Anda valid. Model yang tersedia untuk Key ini: ${modelNames}`;
          } else {
            errorMsg = `Error 404: API Generative Language sepertinya belum diaktifkan untuk API Key ini. Pastikan Anda mendapatkan Key langsung dari Google AI Studio.`;
          }
        } catch (e) {
          errorMsg = `Error 404: Model tidak ditemukan dan gagal mengecek daftar model. Pastikan API Key dari Google AI Studio.`;
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render floating button if closed
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] w-14 h-14 bg-gradient-to-tr from-primary to-[#8A5CF6] rounded-full shadow-[0_0_20px_rgba(78,222,163,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
        title="Tanya Asisten AI"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>
    );
  }

  // Render chat window
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[360px] md:w-[400px] h-[600px] max-h-[85dvh] flex flex-col bg-surface-container/95 backdrop-blur-3xl border border-outline-variant/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden font-['Plus_Jakarta_Sans']">
      
      {/* Header */}
      <div className="p-4 bg-surface-container-high/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-[#8A5CF6] flex items-center justify-center text-white shadow-inner">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Gemini Asisten</h3>
            <p className="text-[10px] text-slate-400">Personal AI Analyst</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSettingsOpen ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-error/20 hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen ? (
        <div className="flex-1 p-6 flex flex-col justify-center gap-4 bg-surface-container-lowest/50">
          <div className="text-center mb-2">
            <span className="material-symbols-outlined text-4xl text-primary mb-2">key</span>
            <h3 className="text-lg font-bold text-slate-200">API Key Gemini</h3>
            <p className="text-xs text-slate-400 mt-1">Dapatkan API Key gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>.</p>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Paste API Key Anda di sini..."
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
            />
            <button 
              onClick={saveApiKey}
              disabled={!inputKey.trim()}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan API Key
            </button>
            {apiKey && (
              <button 
                onClick={removeApiKey}
                className="w-full py-3 bg-error/10 text-error border border-error/20 rounded-xl font-bold hover:bg-error/20 transition-colors mt-2"
              >
                Hapus Key & Logout
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-4">Key Anda hanya disimpan lokal di browser (localStorage) dan tidak dikirim ke server manapun kecuali langsung ke API Google.</p>
        </div>
      ) : (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-sm' 
                      : msg.isError 
                        ? 'bg-error/20 text-error border border-error/30 rounded-tl-sm'
                        : 'bg-surface-container text-slate-200 border border-outline-variant/30 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-surface-container border border-outline-variant/30 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-surface-container-lowest/50 border-t border-white/5">
            <div className="relative flex items-end gap-2 bg-surface-container border border-outline-variant/50 rounded-xl p-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-inner">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya asisten keuangan..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-200 px-3 py-2 max-h-32 min-h-[40px] resize-none outline-none scrollbar-thin"
                rows="1"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="w-8 h-8 flex-shrink-0 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:bg-primary-fixed transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 mr-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-slate-500">Gemini mungkin memberikan info tidak akurat.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
