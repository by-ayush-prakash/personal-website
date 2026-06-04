import React, { useEffect, useRef, useState } from "react";
import { SubstackPost } from "../types";
import { Clock, Calendar, ExternalLink, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { SUBSTACK_URL, YOUTUBE_URL, SPOTIFY_URL } from "../data";

interface PostReaderProps {
  post: SubstackPost;
  onBackToList: () => void;
  onPrevPost: () => void;
  onNextPost: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function PostReader({
  post,
  onBackToList,
  onPrevPost,
  onNextPost,
  hasPrev,
  hasNext,
}: PostReaderProps) {
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Always scroll to top when changing posts to ensure perfect reading focus
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    
    // Auto load audio rate if audio element exists
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.playbackRate = 1;
    }
  }, [post.id]);

  // Clean up audio on unmount or transition
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [post.id]);

  // Toggle play state
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Playback interrupted:", err));
    }
  };

  // Convert seconds to human-readable text mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handlePlaybackSpeedChange = () => {
    const speeds = [1, 1.2, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val > 0) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <article className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* Article Header block */}
      <header className="space-y-3.5 pt-4">
        <h1 className="text-2xl sm:text-3xl md:text-[34px] font-sans font-medium text-black tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Metadata section */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs font-mono text-black font-medium pb-3 border-b border-dotted border-black">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-black" />
            <span>{post.formattedDate}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-black" />
            <span>{post.category === "podcasts" ? `Episode Length: ${post.audioDuration || "30m"}` : `${post.readingTime} min read`}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="text-black">
            By {post.author}
          </span>
        </div>
      </header>

      {/* Conditionally render Interactive Podcast Deck */}
      {post.category === "podcasts" && post.audioUrl && (
        <div className="bg-transparent border border-black rounded-sm p-4 sm:p-5 space-y-4 my-4" id="custom-audio-deck">
          {/* HTML5 Audio Node */}
          <audio
            ref={audioRef}
            src={post.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            preload="metadata"
          />

          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-medium text-black uppercase tracking-widest flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 bg-black ${isPlaying ? "animate-pulse" : "opacity-75"}`} />
            </div>
          </div>

          {/* Scrub timeline row */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleScrubChange}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black animate-none"
              id="audio-scrubber"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-black font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Interactive buttons bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={togglePlay}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-black bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer flex-shrink-0"
                title={isPlaying ? "Pause podcast" : "Play episode"}
                id="deck-play-btn"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-current fill-current" /> : <Play className="w-4 h-4 text-current fill-current ml-0.5" />}
              </button>

              {/* Backward jump */}
              <button
                onClick={skipBackward}
                className="p-2 border border-black text-black hover:bg-black hover:text-white rounded-sm transition-colors cursor-pointer flex-shrink-0"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Cycle Speed */}
              <button
                onClick={handlePlaybackSpeedChange}
                className="px-2.5 py-1.5 border border-black text-[11px] font-mono text-black hover:bg-black hover:text-white bg-transparent rounded-sm transition-colors cursor-pointer flex-shrink-0"
                title="Toggle playback velocity speed"
              >
                {playbackRate}x speed
              </button>
            </div>

            {/* Custom volume widget */}
            <div className="flex items-center justify-center sm:justify-end gap-2 pr-1">
              <button
                onClick={toggleMute}
                className="p-1 text-black cursor-pointer flex-shrink-0"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-black" /> : <Volume2 className="w-4 h-4 text-black" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 sm:w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
                id="audio-vol-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Rich text body */}
      <div
        className="article-content text-black pt-3"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Bottom Subscribe prompt */}
      <div className="mt-12 p-5 sm:p-6 bg-transparent border border-dotted border-black rounded-sm text-center space-y-3.5">
        <h3 className="text-sm font-sans font-medium text-black uppercase tracking-widest">
          {post.category === "podcasts" ? "Subscribe to the Podcast" : "Subscribe for Upcoming Publications"}
        </h3>
        <p className="text-xs text-black font-medium max-w-md mx-auto leading-relaxed">
          {post.category === "podcasts" 
            ? "Listen to future episodes of the podcast on your platform of choice. Subscribe for live recordings, in-depth dialogues, and tech explorations."
            : "This article is automatically synchronized from my Substack newsletter. Subscribe directly to have upcoming long-forms dispatched to your ledger inbox."}
        </p>
        <div className="pt-1.5 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-sm sm:max-w-none mx-auto">
          {post.category === "podcasts" ? (
            <>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-xs font-mono font-medium text-black border border-black bg-white hover:bg-black hover:text-white rounded-sm transition-colors w-full sm:w-auto"
                id="reader-subscribe-youtube-cta"
              >
                <span>SUBSCRIBE ON YOUTUBE</span>
                <ExternalLink className="w-3.5 h-3.5 text-current" />
              </a>
              <a
                href={SPOTIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-xs font-mono font-medium text-black border border-black bg-white hover:bg-black hover:text-white rounded-sm transition-colors w-full sm:w-auto"
                id="reader-subscribe-spotify-cta"
              >
                <span>SUBSCRIBE ON SPOTIFY</span>
                <ExternalLink className="w-3.5 h-3.5 text-current" />
              </a>
            </>
          ) : (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-xs font-mono font-medium text-black border border-black bg-white hover:bg-black hover:text-white rounded-sm transition-colors w-full sm:w-auto"
              id="reader-subscribe-cta"
            >
              <span>SUBSCRIBE ON SUBSTACK</span>
              <ExternalLink className="w-3.5 h-3.5 text-current" />
            </a>
          )}
        </div>
      </div>

      {/* Chronological Navigation footer */}
      <div className="pt-8 border-t border-dotted border-black flex items-center justify-between text-xs font-mono text-black font-medium">
        <button
          onClick={onPrevPost}
          disabled={!hasPrev}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm transition-all border ${
            hasPrev
              ? "text-black border-black bg-transparent hover:bg-black hover:text-white cursor-pointer font-medium"
              : "opacity-30 cursor-not-allowed border-black/20 text-black/30 font-medium"
          }`}
          title="Previous chronological article"
          id="reader-prev-btn"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>[Prev]</span>
        </button>

        <button
          onClick={onNextPost}
          disabled={!hasNext}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm transition-all border ${
            hasNext
              ? "text-black border-black bg-transparent hover:bg-black hover:text-white cursor-pointer font-medium"
              : "opacity-30 cursor-not-allowed border-black/20 text-black/30 font-medium"
          }`}
          title="Next chronological article"
          id="reader-next-btn"
        >
          <span>[Next]</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

