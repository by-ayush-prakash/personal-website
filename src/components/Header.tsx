import { BRAND_NAME, SUBSTACK_URL, CONTACT_EMAIL, LINKEDIN_URL, YOUTUBE_URL } from "../data";
import { Sun, Moon, ArrowLeft } from "lucide-react";
// @ts-ignore
import gargoyleImage from "../assets/images/image-2.png";

interface HeaderProps {
  onBackToList: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  activeCategory: "all" | "writing" | "podcasts";
  setActiveCategory: (category: "all" | "writing" | "podcasts") => void;
  hasPostActive: boolean;
}

export default function Header({
  onBackToList,
  theme,
  onToggleTheme,
  activeCategory,
  setActiveCategory,
  hasPostActive,
}: HeaderProps) {
  return (
    <header className="space-y-6 mb-8 w-full">
      {/* Top row containing the Vitalik-style capsule slider at top right */}
      <div className="flex justify-between items-center w-full">
        {/* Simple back pointer if reading a post, otherwise blank space */}
        <div>
          {hasPostActive && (
            <button
              onClick={onBackToList}
              className="flex items-center text-xs font-mono text-black hover:opacity-75 transition-colors cursor-pointer"
              id="back-index-top"
              title="Return to Index"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
            </button>
          )}
        </div>
        <div />
      </div>

      {/* Master Title centered */}
      <div className="flex flex-row items-center justify-center py-2 w-full pb-1">
        <button
          onClick={() => {
            onBackToList();
            setActiveCategory("all");
          }}
          className="text-4xl sm:text-[42px] md:text-5xl font-medium font-sans tracking-tight hover:opacity-85 transition-opacity cursor-pointer text-black text-center leading-none"
          id="brand-master-title"
        >
          By {BRAND_NAME}
        </button>
      </div>

      {/* Categories block framed between two solid lines (Vitalik signature style) */}
      <div className="space-y-3.5">
        <hr className="border-t-[3px] border-black" />
        
        {/* Navigation line container */}
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-4 sm:gap-x-5 md:gap-x-7 text-sm font-sans font-medium text-center text-black">
          <button
            onClick={() => {
              onBackToList();
              setActiveCategory("all");
            }}
            className={`transition-colors whitespace-nowrap cursor-pointer text-[14px] sm:text-[15px] text-black ${
              activeCategory === "all" && !hasPostActive
                ? "font-medium underline decoration-[3px] underline-offset-[6px]"
                : "hover:underline"
            }`}
            id="nav-cat-all"
          >
            All
          </button>

          <button
            onClick={() => {
              onBackToList();
              setActiveCategory("writing");
            }}
            className={`transition-colors whitespace-nowrap cursor-pointer text-[14px] sm:text-[15px] text-black ${
              activeCategory === "writing" && !hasPostActive
                ? "font-medium underline decoration-[3px] underline-offset-[6px]"
                : "hover:underline"
            }`}
            id="nav-cat-writing"
          >
            Writing
          </button>

          <button
            onClick={() => {
              onBackToList();
              setActiveCategory("podcasts");
            }}
            className={`transition-colors whitespace-nowrap cursor-pointer text-[14px] sm:text-[15px] text-black ${
              activeCategory === "podcasts" && !hasPostActive
                ? "font-medium underline decoration-[3px] underline-offset-[6px]"
                : "hover:underline"
            }`}
            id="nav-cat-podcasts"
          >
            Podcasts
          </button>

          <hr className="hidden xs:block h-4 w-[1px] bg-black/45 border-none mx-0.5" />

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline transition-colors whitespace-nowrap text-[14px] sm:text-[15px] font-medium"
            id="nav-link-linkedin"
          >
            Linkedin
          </a>

          <a
            href={SUBSTACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline transition-colors whitespace-nowrap text-[14px] sm:text-[15px] font-medium"
            id="nav-link-substack"
          >
            Substack
          </a>

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline transition-colors whitespace-nowrap text-[14px] sm:text-[15px] font-medium"
            id="nav-link-youtube"
          >
            YouTube
          </a>

          <a
            href="https://innovatingfuture.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center select-none flex-shrink-0 hover:opacity-80 transition-opacity"
            id="nav-link-gargoyle-innovating"
            title="Innovating Future"
          >
            <img
              src={gargoyleImage}
              alt="Gargoyle"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform duration-200 hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>

        <hr className="border-b-[3px] border-black" />
      </div>
    </header>
  );
}

