
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CalculationInputs, CalculationResult } from './types';
import { calculateFreedomTime } from './logic';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<CalculationInputs>({
    completedHrs: '',
    completedMins: '',
    lastInHrs: '',
    lastInMins: ''
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [notifState, setNotifState] = useState<'idle' | 'ready' | 'locked'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value.length > 2) return;
    setInputs(prev => ({ ...prev, [name]: value }));
    // Reset notification state if inputs change
    if (notifState !== 'idle') {
      setNotifState('idle');
      setResult(null);
    }
  };

  const handleCalculate = useCallback(() => {
    const res = calculateFreedomTime(inputs);
    setResult(res);
    setNotifState('ready');
  }, [inputs]);

  const handleScheduleNotification = async () => {
    if (!result || !result.isValid) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert("SYSTEM ERROR: Notification permissions denied. Cannot arm extraction alert.");
      return;
    }

    // Calculate the target date object for today
    const now = new Date();
    const target = new Date();
    target.setHours(result.hours, result.minutes, 0, 0);

    // If the target time has already passed today (e.g., wrap-around), 
    // we assume it's for the next day, though usually in this context it's same-day.
    if (target < now) {
      target.setDate(target.getDate() + 1);
    }

    // Target is 5 minutes before the end time
    const notifyAt = new Date(target.getTime() - 5 * 60 * 1000);
    const delay = notifyAt.getTime() - now.getTime();

    if (delay <= 0) {
      // If end time is less than 5 mins away, notify immediately
      new Notification("Extraction Imminent", {
        body: "Your time will complete in less than 5 minutes. Prepare for egress.",
        icon: "https://cdn-icons-png.flaticon.com/512/252/252035.png"
      });
    } else {
      setTimeout(() => {
        new Notification("Extraction Alert", {
          body: "Your time will complete after 5 minutes. Gear up.",
          icon: "https://cdn-icons-png.flaticon.com/512/252/252035.png"
        });
      }, delay);
    }

    setNotifState('locked');
  };

  const progress = useMemo(() => {
    const h = parseInt(inputs.completedHrs) || 0;
    const m = parseInt(inputs.completedMins) || 0;
    const totalMins = (h * 60) + m;
    const targetMins = 8 * 60;
    return Math.min(100, Math.max(0, (totalMins / targetMins) * 100));
  }, [inputs.completedHrs, inputs.completedMins]);

  const clockAngles = useMemo(() => {
    if (!result || !result.isValid) return { hr: 0, min: 0 };
    const hr = ((result.hours % 12) / 12) * 360 + (result.minutes / 60) * 30;
    const min = (result.minutes / 60) * 360;
    return { hr, min };
  }, [result]);

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 md:p-8 font-['JetBrains_Mono',monospace] text-cyan-500 overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* HUD Borders */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none"></div>

      <div className="relative w-full max-w-5xl h-full flex flex-col justify-between py-4">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-cyan-500/20 pb-4">
          <div>
            <div className="text-[10px] font-bold tracking-[0.4em] opacity-60 mb-1">TERMINAL: EXTRACTION_AUTH_V6.1</div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase font-['Orbitron'] text-white">
              Tactical <span className="text-cyan-500">HUD</span>
            </h1>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Protocol: Timely Egress</div>
            <div className="text-[10px] opacity-40 flex items-center justify-end gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${notifState === 'locked' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-500/30'}`}></span>
              ALERT_ARMED: {notifState === 'locked' ? 'TRUE' : 'FALSE'}
            </div>
          </div>
        </div>

        {/* HUD Middle Zone */}
        <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-4 overflow-hidden">
          
          {/* Circular Display */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
            <div className="absolute inset-0 border-[1px] border-cyan-500/20 rounded-full scale-[1.05] animate-pulse"></div>
            
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Sync Rate Gauge */}
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${result?.isValid ? 'opacity-0 scale-75 rotate-90 pointer-events-none' : 'opacity-100 scale-100 rotate-0'}`}>
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" fill="transparent" stroke="currentColor" strokeWidth="2" className="opacity-10" />
                  <circle
                    cx="50%" cy="50%" r="45%" fill="transparent" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="283%" strokeDashoffset={`${283 - (progress * 2.83)}%`}
                    className={`transition-all duration-1000 ease-out ${progress >= 100 ? 'text-green-500' : 'text-cyan-400'}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl md:text-6xl font-black font-['Orbitron'] text-white">{Math.round(progress)}%</div>
                  <div className="text-[10px] font-bold tracking-[0.3em] opacity-40 uppercase">Sync Rate</div>
                </div>
              </div>

              {/* Analog Clock Display */}
              <div className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] transform ${result?.isValid ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-125 -rotate-90 pointer-events-none'}`}>
                <div className="relative w-full h-full border-2 border-cyan-500/30 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-120px)` }}>
                      <div className={`h-3 w-1 ${i % 3 === 0 ? 'bg-cyan-500 h-5 w-[2px]' : 'bg-cyan-500/30'}`}></div>
                    </div>
                  ))}
                  <div className="absolute top-1/2 left-1/2 w-1.5 h-20 bg-white rounded-full origin-bottom -translate-x-1/2 -translate-y-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ transform: `translate(-50%, -100%) rotate(${clockAngles.hr}deg)` }}></div>
                  <div className="absolute top-1/2 left-1/2 w-1 h-28 bg-cyan-400 rounded-full origin-bottom -translate-x-1/2 -translate-y-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ transform: `translate(-50%, -100%) rotate(${clockAngles.min}deg)` }}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-500 rounded-full border-2 border-black z-10 shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-cyan-500/60 uppercase text-center w-full">Target: {result?.formatted}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-sm px-4 space-y-6">
            <div className="space-y-4">
              <div className="relative p-5 bg-cyan-500/5 border-l-4 border-cyan-500 rounded-r-lg">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Shift Duration Logged</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1"><input type="number" name="completedHrs" placeholder="00" value={inputs.completedHrs} onChange={handleInputChange} className="w-full bg-black/40 border border-cyan-500/30 rounded-lg py-3 text-2xl font-bold text-white outline-none focus:border-cyan-500 transition-colors text-center font-['Orbitron']" /></div>
                  <div className="text-2xl font-bold opacity-20">:</div>
                  <div className="flex-1"><input type="number" name="completedMins" placeholder="00" value={inputs.completedMins} onChange={handleInputChange} className="w-full bg-black/40 border border-cyan-500/30 rounded-lg py-3 text-2xl font-bold text-white outline-none focus:border-cyan-500 transition-colors text-center font-['Orbitron']" /></div>
                </div>
              </div>

              <div className="relative p-5 bg-purple-500/5 border-l-4 border-purple-500 rounded-r-lg">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Last Sector Entry</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1"><input type="number" name="lastInHrs" placeholder="00" value={inputs.lastInHrs} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/30 rounded-lg py-3 text-2xl font-bold text-white outline-none focus:border-purple-500 transition-colors text-center font-['Orbitron']" /></div>
                  <div className="text-2xl font-bold opacity-20">:</div>
                  <div className="flex-1"><input type="number" name="lastInMins" placeholder="00" value={inputs.lastInMins} onChange={handleInputChange} className="w-full bg-black/40 border border-purple-500/30 rounded-lg py-3 text-2xl font-bold text-white outline-none focus:border-purple-500 transition-colors text-center font-['Orbitron']" /></div>
                </div>
              </div>
            </div>

            {/* Dynamic Action Button */}
            {notifState === 'idle' ? (
              <button onClick={handleCalculate} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-5 uppercase tracking-[0.3em] rounded-md transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] text-sm font-['Orbitron']">
                Initialize Sync
              </button>
            ) : (
              <button 
                onClick={handleScheduleNotification} 
                disabled={notifState === 'locked'}
                className={`w-full font-black py-5 uppercase tracking-[0.2em] rounded-md transition-all text-sm font-['Orbitron'] flex items-center justify-center gap-3 ${
                  notifState === 'locked' 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                }`}
              >
                {notifState === 'locked' ? (
                  <>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                    Alert Armed: {result?.formatted}
                  </>
                ) : (
                  `Notify at ${result?.formatted}`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer HUD Segment */}
        <div className="h-32 md:h-40 border-t border-cyan-500/20 pt-4 md:pt-6 relative">
          {!result?.isValid ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-cyan-500/20 animate-pulse">
              <div className="text-xs font-bold tracking-[0.4em] uppercase italic">Standby Mode</div>
              <div className="text-[9px] uppercase">Awaiting mission parameters...</div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between h-full bg-cyan-500/[0.03] p-6 rounded-2xl border border-cyan-500/10 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-8">
                <div className="text-6xl md:text-8xl font-black font-['Orbitron'] text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">{result.formatted}</div>
              </div>
              <div className="text-center md:text-right mt-4 md:mt-0">
                <div className="text-[11px] font-black tracking-[0.2em] mb-1 text-cyan-400">STATUS: {progress >= 100 ? 'EXTRACT_AUTH' : 'HOLD_SECTOR'}</div>
                <div className={`text-sm md:text-lg font-black uppercase italic ${progress >= 100 ? 'text-green-500' : 'text-white'}`}>
                  {progress >= 100 ? 'Extraction Authorized' : 'Protocol Sustained'}
                </div>
                {notifState === 'locked' && (
                  <div className="text-[9px] text-amber-400/80 mt-2 font-bold uppercase tracking-widest animate-pulse">
                    Alert Sequence Initialized T-Minus 5
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
      <div className="fixed bottom-3 left-6 text-[10px] opacity-30 font-black tracking-widest">
        BUF: {inputs.completedHrs || '00'}.{inputs.completedMins || '00'} // KEKA_FREEDOM_HUD v6.1.4
      </div>
    </div>
  );
};

export default App;
