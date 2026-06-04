import { FALLBACK_BIO } from "../data";

interface AboutSectionProps {
  totalPosts: number;
}

export default function AboutSection({ totalPosts }: AboutSectionProps) {
  return (
    <div className="bg-transparent border border-black rounded-sm p-6 mb-8 transition-all" id="about-log-box">
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-dotted border-black">
          <span className="w-2 h-2 bg-black"></span>
          <h2 className="text-sm font-mono font-medium tracking-wider text-black uppercase">
            ABOUT
          </h2>
        </div>

        <div className="font-sans text-[15px] leading-relaxed text-black space-y-4">
          <p className="whitespace-pre-line leading-relaxed">{FALLBACK_BIO.trim()}</p>
        </div>
      </div>
    </div>
  );
}
