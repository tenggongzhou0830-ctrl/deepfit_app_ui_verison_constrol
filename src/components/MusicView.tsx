import { useState, useEffect, useRef, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Track } from "../types";

interface MusicViewProps {
  key?: string;
  tracks: Track[];
  currentTrackIndex: number;
  setCurrentTrackIndex: (idx: number) => void;
}

export default function MusicView({
  tracks,
  currentTrackIndex,
  setCurrentTrackIndex,
}: MusicViewProps) {
  const currentTrack = tracks[currentTrackIndex];

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(84); // 1:24
  const [trackDuration] = useState(225); // 3:45
  const [isFavorite, setIsFavorite] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Playback Modes: 'list' (列表循环), 'single' (单曲循环), 'shuffle' (随机播放)
  type PlayMode = "list" | "single" | "shuffle";
  const [playMode, setPlayMode] = useState<PlayMode>("list");

  // Audio Quality States: 'standard' (标准), 'high' (极高), 'lossless' (无损), 'hires' (Hi-Res)
  type AudioQuality = "standard" | "high" | "lossless" | "hires";
  const [audioQuality, setAudioQuality] = useState<AudioQuality>("high");
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Track window size for responsive lyrics scroll centering
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Action: Handle previous track
  const handlePrev = () => {
    setCurrentTime(0);
    if (playMode === "shuffle") {
      let rand = Math.floor(Math.random() * tracks.length);
      // Try to avoid repeating same track if there's multiple
      if (tracks.length > 1 && rand === currentTrackIndex) {
        rand = (rand + 1) % tracks.length;
      }
      setCurrentTrackIndex(rand);
    } else {
      const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      setCurrentTrackIndex(prevIdx);
    }
  };

  // Action: Handle next track
  const handleNext = () => {
    setCurrentTime(0);
    if (playMode === "shuffle") {
      let rand = Math.floor(Math.random() * tracks.length);
      if (tracks.length > 1 && rand === currentTrackIndex) {
        rand = (rand + 1) % tracks.length;
      }
      setCurrentTrackIndex(rand);
    } else {
      const nextIdx = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIdx);
    }
  };

  // Action: PlayMode Cycling
  const cyclePlayMode = () => {
    let nextMode: PlayMode = "list";
    if (playMode === "list") nextMode = "single";
    else if (playMode === "single") nextMode = "shuffle";
    else if (playMode === "shuffle") nextMode = "list";

    setPlayMode(nextMode);

    const modeLabels: Record<PlayMode, string> = {
      list: "列表循环 🔁",
      single: "单曲循环 🔂",
      shuffle: "随机播放 🔀",
    };
    setToastMessage(`已切换到 [${modeLabels[nextMode]}]`);
  };

  // Action: Quality Changing
  const changeQuality = (quality: AudioQuality) => {
    setAudioQuality(quality);
    setIsQualityMenuOpen(false);

    const qualityNames: Record<AudioQuality, string> = {
      standard: "标准 (128kbps)",
      high: "极高 (320kbps)",
      lossless: "FLAC 无损",
      hires: "Hi-Res 母带级",
    };

    setToastMessage(`音质已切换至 [${qualityNames[quality]}]，重载音轨中...`);

    // Buffering effect
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      setIsPlaying(false);
      setTimeout(() => {
        setIsPlaying(true);
      }, 700);
    }
  };

  // Time progress timer hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= trackDuration) {
            if (playMode === "single") {
              return 0; // loop single
            }
            // Otherwise, next track
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playMode, currentTrackIndex]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate lyric highlighting
  const lyricsCount = currentTrack.lyrics.length;
  const lyricSegment = Math.floor(trackDuration / lyricsCount);
  const currentLyricIdx = Math.min(
    Math.floor(currentTime / lyricSegment),
    lyricsCount - 1
  );

  // Seek bar click handler
  const progressBarRef = useRef<HTMLDivElement>(null);
  const handleProgressSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = Math.max(0, Math.min(clickX / width, 1));
    setCurrentTime(Math.floor(pct * trackDuration));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-brand-black/25 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 overflow-hidden flex flex-col min-h-[580px] md:min-h-[520px] shadow-2xl"
    >
      {/* Ins-style Elegant Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.65)] flex items-center gap-2 select-none"
          >
            <span className="w-2 h-2 rounded-full bg-brand-lime animate-ping"></span>
            <span className="text-xs font-black text-neutral-200 tracking-wide">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Absolute Blurred Cover Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-125 transition-all duration-700"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0e]/40 via-[#0e0e0e]/95 to-[#0a0a0a]"></div>
      </div>

      {/* Top Header Panel */}
      <div className="flex justify-between items-center w-full mb-6 relative z-10">
        <button
          onClick={() => setIsListOpen(true)}
          className="p-2 text-brand-text-muted hover:text-brand-text hover:bg-white/5 rounded-full transition-all flex items-center justify-center cursor-pointer"
          title="播放列表"
        >
          <span className="material-symbols-outlined text-xl">queue_music</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[9px] text-brand-text-dark uppercase tracking-widest font-mono font-black">
            NETEASE MUSIC PLAYER
          </span>
          <span className="text-xs font-black text-brand-lime font-display tracking-wider">
            网易云音乐 伴练模式
          </span>
        </div>

        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className={`p-2 transition-all rounded-full hover:bg-white/5 flex items-center justify-center cursor-pointer ${
            isFavorite ? "text-red-500 scale-105" : "text-brand-text-muted hover:text-brand-text"
          }`}
          title={isFavorite ? "取消自选" : "加入自选"}
        >
          <span className="material-symbols-outlined text-xl fill-1">
            {isFavorite ? "favorite" : "favorite_border"}
          </span>
        </button>
      </div>

      {/* Responsive Main Section: CD on Left, Lyrics on Right for Desktop */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-8 items-center md:items-stretch mb-6 relative z-10 w-full">
        
        {/* LEFT COLUMN: Classic Vinyl CD & Tonearm Stylus */}
        <div className="md:col-span-5 flex flex-col items-center justify-center gap-5 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-white/5">
          {/* Relative Container for CD & Needle */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center select-none">
            
            {/* TONEARM / NEEDLE */}
            <motion.div
              className="absolute z-20 top-[-24px] left-[52%] -translate-x-[22px]"
              style={{ transformOrigin: "24px 24px" }}
              animate={{ rotate: isPlaying ? 0 : -32 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
            >
              <svg width="90" height="130" viewBox="0 0 90 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                {/* Pivot Mount Ring */}
                <circle cx="24" cy="24" r="14" fill="#141414" stroke="#444444" strokeWidth="2" />
                <circle cx="24" cy="24" r="7" fill="#e2e8f0" />
                <circle cx="24" cy="24" r="2.5" fill="#111111" />
                
                {/* Metallic Curved Tonearm Line */}
                <path 
                  d="M24 24 
                     L24 45 
                     C24 72, 68 82, 68 102 
                     L68 114" 
                  stroke="#ffffff" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  className="opacity-95"
                />
                <path 
                  d="M24 24 
                     L24 45 
                     C24 72, 68 82, 68 102 
                     L68 114" 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                />
                
                {/* Stylus Cartridge Head */}
                <g transform="rotate(-15 68 114)">
                  <rect x="62" y="114" width="12" height="15" rx="1.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="65" y="116" width="6" height="11" rx="0.5" fill="#1e293b" />
                  {/* Neon laser active playback indicator */}
                  <circle cx="68" cy="125" r="1" fill="#c3f400" className="animate-pulse" />
                </g>
              </svg>
            </motion.div>

            {/* BLACK VINYL CD RECORD */}
            <div
              className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-r from-[#181818] via-[#242424] to-[#181818] border-[10px] border-[#0a0a0a] flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.85)] border-solid animate-[spin_30s_linear_infinite] ${
                isPlaying ? "[animation-play-state:running]" : "[animation-play-state:paused]"
              }`}
            >
              {/* Concentric Groove Lines Simulator */}
              <div className="absolute inset-1.5 rounded-full border border-black/35"></div>
              <div className="absolute inset-4 rounded-full border border-black/30"></div>
              <div className="absolute inset-6.5 rounded-full border border-black/25"></div>
              <div className="absolute inset-9 rounded-full border border-black/20"></div>
              <div className="absolute inset-11.5 rounded-full border border-black/15"></div>
              <div className="absolute inset-14 rounded-full border border-black/10"></div>
              <div className="absolute inset-16 rounded-full border border-black/5"></div>

              {/* Center Album Art Cover */}
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[5px] border-neutral-900 shadow-inner z-10">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Center spindle hole */}
              <div className="absolute w-3.5 h-3.5 bg-[#141414] rounded-full border-2 border-neutral-700 flex items-center justify-center z-20">
                <div className="w-1 h-1 bg-neutral-900 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* CD Bottom Controller Action Bar */}
          <div className="flex items-center gap-6 mt-1 text-brand-text-muted">
            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              className={`hover:text-brand-text transition-all active:scale-95 cursor-pointer ${isFavorite ? 'text-red-500 scale-110' : ''}`}
              title="喜欢"
            >
              <span className="material-symbols-outlined text-2xl fill-1">
                {isFavorite ? "favorite" : "favorite_border"}
              </span>
            </button>
            <button className="hover:text-brand-text transition-all relative active:scale-95 cursor-pointer" title="评论">
              <span className="material-symbols-outlined text-2xl">comment</span>
              <span className="absolute -top-1.5 -right-3.5 bg-red-500 text-white font-mono font-bold text-[8px] px-1 py-0.2 rounded-full border border-[#111] shadow-sm leading-none">
                99k+
              </span>
            </button>
            <button className="hover:text-brand-text transition-all active:scale-95 cursor-pointer animate-pulse" title="VIP特权">
              <span className="material-symbols-outlined text-2xl text-brand-lime">workspace_premium</span>
            </button>
            <button className="hover:text-brand-text transition-all active:scale-95 cursor-pointer" title="更多选项">
              <span className="material-symbols-outlined text-2xl">more_vert</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Song Metadata & High-fidelity Lyrics Pane */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start justify-center text-center md:text-left gap-4 w-full md:pl-6 pt-4 md:pt-0">
          
          {/* Song Metadata Titles */}
          <div className="flex flex-col gap-1 w-full items-center md:items-start">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <h3 className="text-lg md:text-2xl font-display font-black text-brand-text tracking-wide truncate max-w-[280px] md:max-w-md">
                {currentTrack.title}
              </h3>
              <span className="text-[9px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/30 px-1 py-0.5 rounded leading-none select-none">
                VIP
              </span>
              <span className="text-[9px] font-extrabold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 px-1 py-0.5 rounded leading-none cursor-pointer hover:bg-brand-cyan/25 select-none transition-colors">
                MV
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 mt-1 text-xs text-brand-text-muted font-bold">
              <span>歌手：<span className="text-brand-cyan hover:underline cursor-pointer">{currentTrack.artist}</span></span>
              <span className="text-white/10">•</span>
              <span>专辑：<span className="text-brand-text-dark hover:underline cursor-pointer">极限界速特训合辑</span></span>
            </div>
          </div>

          {/* Scrollable Lyrics Container with Top & Bottom Fade Overlay */}
          <div className="h-36 md:h-64 relative overflow-hidden w-full bg-brand-black/25 backdrop-blur-sm rounded-2xl border border-white/5 p-4 z-10 select-none">
            {/* Top/Bottom Gradient Fades */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0e0e0e]/95 via-[#0e0e0e]/40 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0e0e0e]/95 via-[#0e0e0e]/40 to-transparent pointer-events-none z-10"></div>

            <motion.div
              animate={{ y: (isDesktop ? 110 : 48) - currentLyricIdx * 42 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
              className="text-center flex flex-col items-center"
            >
              {currentTrack.lyrics.map((lyric, idx) => {
                const isActive = idx === currentLyricIdx;
                return (
                  <motion.p
                    key={lyric + idx}
                    animate={{
                      scale: isActive ? 1.35 : 0.85,
                      opacity: isActive ? 1 : 0.35,
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`transition-all duration-300 font-sans text-xs md:text-sm ${
                      isActive
                        ? "text-brand-lime font-black drop-shadow-[0_0_10px_rgba(195,244,0,0.5)]"
                        : "text-brand-text-muted/65 font-medium"
                    }`}
                    style={{
                      height: "42px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lyric}
                  </motion.p>
                );
              })}
            </motion.div>
          </div>

        </div>
      </div>

      {/* Progress Slider (Interactive!) */}
      <div className="w-full px-2 mb-6 relative z-10">
        <div className="flex items-center space-x-3 text-[10px] font-mono font-bold text-brand-text-muted">
          <span className="w-8 text-right">{formatTime(currentTime)}</span>
          <div
            ref={progressBarRef}
            onClick={handleProgressSeek}
            className="flex-1 h-1 bg-brand-card-light/40 hover:h-1.5 rounded-full relative cursor-pointer group transition-all"
          >
            {/* Progress Fill */}
            <div
              className="absolute top-0 left-0 h-full bg-brand-lime rounded-full shadow-[0_0_8px_rgba(195,244,0,0.6)]"
              style={{ width: `${(currentTime / trackDuration) * 100}%` }}
            ></div>
            {/* Playhead */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-text rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-1.5 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{ left: `${(currentTime / trackDuration) * 100}%` }}
            ></div>
          </div>
          <span className="w-8 text-left">{formatTime(trackDuration)}</span>
        </div>
      </div>

      {/* Primary Player Action Controls */}
      <div className="flex justify-between items-center w-full px-4 mb-2 relative z-10">
        {/* Quality Selector Badge */}
        <div className="relative">
          <button
            onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
            className="flex items-center justify-center select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="点击选择音质"
          >
            <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full border leading-none transition-all duration-300 ${
              audioQuality === "standard" ? "text-brand-text-dark border-white/10 bg-white/5" :
              audioQuality === "high" ? "text-brand-lime border-brand-lime/30 bg-brand-lime/10 drop-shadow-[0_0_6px_rgba(195,244,0,0.15)]" :
              audioQuality === "lossless" ? "text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10 drop-shadow-[0_0_6px_rgba(0,240,255,0.15)]" :
              "text-amber-400 border-amber-500/30 bg-amber-500/10 drop-shadow-[0_0_6px_rgba(245,158,11,0.15)]"
            }`}>
              {audioQuality === "standard" ? "标准" :
               audioQuality === "high" ? "极高" :
               audioQuality === "lossless" ? "无损" : "母带"}
            </span>
          </button>

          {/* Floated Dropdown Menu */}
          <AnimatePresence>
            {isQualityMenuOpen && (
              <>
                {/* Backdrop overlay to close */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsQualityMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="absolute bottom-10 left-0 z-40 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[140px] flex flex-col gap-1 select-none"
                >
                  <p className="text-[8px] font-black text-neutral-500 px-2.5 py-1 uppercase tracking-widest border-b border-white/5 mb-1">
                    音质选择 (可接入)
                  </p>
                  {[
                    { key: "standard", label: "标准音质", desc: "128kbps 流畅", color: "text-neutral-300" },
                    { key: "high", label: "极高音质", desc: "320kbps 高清", color: "text-brand-lime" },
                    { key: "lossless", label: "无损音质", desc: "CD级 1411kbps", color: "text-brand-cyan" },
                    { key: "hires", label: "Hi-Res 母带", desc: "24bit 极速解析", color: "text-amber-400" }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => changeQuality(item.key as AudioQuality)}
                      className={`flex flex-col items-start w-full px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer ${
                        audioQuality === item.key
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span className={`text-[11px] font-black ${item.color}`}>
                        {item.label}
                      </span>
                      <span className="text-[8px] text-neutral-500 leading-none mt-0.5">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Central Controller Buttons */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* PlayMode Selector Button (INS Style Rounded) */}
          <button
            onClick={cyclePlayMode}
            className="w-10 h-10 transition-all rounded-full border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-brand-text flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title={`当前：${
              playMode === "list" ? "列表循环" :
              playMode === "single" ? "单曲循环" : "随机播放"
            }`}
          >
            <span className={`material-symbols-outlined text-lg ${playMode !== 'list' ? 'text-brand-lime drop-shadow-[0_0_5px_rgba(195,244,0,0.3)]' : ''}`}>
              {playMode === "list" ? "repeat" :
               playMode === "single" ? "repeat_one" : "shuffle"}
            </span>
          </button>

          {/* Prev Button (INS Style Rounded) */}
          <button
            onClick={handlePrev}
            className="w-10 h-10 transition-all rounded-full border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 text-brand-text hover:text-brand-lime flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title="上一首"
          >
            <span className="material-symbols-outlined text-xl fill-1">skip_previous</span>
          </button>

          {/* Big central Play/Pause circle (INS Style Rounded Glow) */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_8px_25px_rgba(195,244,0,0.25)] border border-brand-lime/25 ${
              isPlaying 
                ? "bg-brand-lime text-brand-black hover:brightness-110" 
                : "bg-white/10 text-brand-text hover:bg-brand-lime hover:text-brand-black border-white/10 hover:border-brand-lime/20"
            }`}
            title={isPlaying ? "暂停" : "播放"}
          >
            <span className="material-symbols-outlined text-2xl fill-1">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          {/* Next Button (INS Style Rounded) */}
          <button
            onClick={handleNext}
            className="w-10 h-10 transition-all rounded-full border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 text-brand-text hover:text-brand-lime flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title="下一首"
          >
            <span className="material-symbols-outlined text-xl fill-1">skip_next</span>
          </button>

          {/* Sound Volume / Mute button (INS Style Rounded) */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 transition-all rounded-full border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
              isMuted ? "text-neutral-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10" : "text-brand-text-muted hover:text-brand-text"
            }`}
            title={isMuted ? "取消静音" : "静音"}
          >
            <span className="material-symbols-outlined text-lg">
              {isMuted ? "volume_off" : "volume_up"}
            </span>
          </button>
        </div>

        {/* Right Action Button (Optional secondary, let's keep list button accessibility here or a nice equalizer bar) */}
        <button
          onClick={() => setIsListOpen(true)}
          className="w-10 h-10 transition-all rounded-full border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-brand-text flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
          title="播放列表"
        >
          <span className="material-symbols-outlined text-lg">queue_music</span>
        </button>
      </div>

      {/* Playlist Sliding Side Panel */}
      <AnimatePresence>
        {isListOpen && (
          <div className="absolute inset-0 z-20 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsListOpen(false)}
              className="absolute inset-0 bg-brand-black/85 backdrop-blur-sm"
            ></motion.div>

            {/* Content Drawer */}
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative bg-[#141414] rounded-t-3xl border-t border-white/10 p-5 w-full z-10 max-h-[360px] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-sm font-display font-extrabold text-brand-lime">
                  伴练歌单
                </span>
                <button
                  onClick={() => setIsListOpen(false)}
                  className="text-brand-text-dark hover:text-brand-text"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-1">
                {tracks.map((track, idx) => {
                  const isActive = idx === currentTrackIndex;
                  return (
                    <button
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setCurrentTime(0);
                        setIsPlaying(true);
                        setIsListOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-brand-lime/10 border border-brand-lime/20"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-10 h-10 object-cover rounded-md"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className={`text-xs font-bold ${isActive ? "text-brand-lime" : "text-brand-text"}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-brand-text-muted mt-0.5">{track.artist}</p>
                        </div>
                      </div>

                      {isActive && isPlaying && (
                        <span className="w-1.5 h-3 bg-brand-lime rounded-full animate-pulse"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

