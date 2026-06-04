import { useState, useEffect } from "react";
import { SubstackPost } from "./types";
import { BRAND_NAME } from "./data";
import Header from "./components/Header";
import AboutSection from "./components/AboutSection";
import PostList from "./components/PostList";
import PostReader from "./components/PostReader";
import { Loader2, RefreshCw } from "lucide-react";

export default function App() {
  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeCategory, setActiveCategory] = useState<"all" | "writing" | "podcasts">("all");

  // Load theme and posts on mount
  useEffect(() => {
    // 1. Initial Theme setting from localStorage or preferred
    const savedTheme = localStorage.getItem("prakash-website-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Vitalik's site default is a glowing light parchment look, let's default to light
      setTheme("light");
      applyTheme("light");
    }

    // 2. Fetch the Substack RSS feed
    fetchWritings();
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("prakash-website-theme", nextTheme);
  };

  const fetchWritings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both Substack and Podcast feeds in parallel
      const [subsResponse, podResponse] = await Promise.allSettled([
        fetch("/api/feed"),
        fetch("/api/podcast-feed")
      ]);

      let parsedPosts: SubstackPost[] = [];
      const errorsList: string[] = [];
      const parser = new DOMParser();

      // 1. Process Substack Feed
      if (subsResponse.status === "fulfilled" && subsResponse.value.ok) {
        try {
          const xmlText = await subsResponse.value.text();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const items = xmlDoc.querySelectorAll("item");
          
          const subsParsed = Array.from(items).map((item) => {
            const guid = item.querySelector("guid")?.textContent || "";
            const title = item.querySelector("title")?.textContent || "Untitled Post";
            const link = item.querySelector("link")?.textContent || "";
            const pubDateStr = item.querySelector("pubDate")?.textContent || "";
            const description = item.querySelector("description")?.textContent || "";
            
            let content = "";
            const contentNode = item.getElementsByTagName("content:encoded")[0] || item.getElementsByTagName("encoded")[0] || item.querySelector("encoded");
            if (contentNode) {
              content = contentNode.textContent || "";
            } else {
              content = description;
            }

            const creatorNode = item.getElementsByTagName("dc:creator")[0] || item.querySelector("creator") || item.querySelector("author");
            const author = creatorNode?.textContent || BRAND_NAME;

            const dateObj = new Date(pubDateStr);
            const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();
            
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : pubDateStr;

            const cleanText = content.replace(/<[^>]*>/g, "");
            const words = cleanText.trim().split(/\s+/).filter((w) => w.length > 0);
            const wordCount = words.length;
            const readingTime = Math.max(1, Math.round(wordCount / 220));

            const enclosure = item.querySelector("enclosure");
            const enclosureType = enclosure?.getAttribute("type") || "";
            const enclosureUrl = enclosure?.getAttribute("url") || "";
            
            const isPodcast = 
              enclosureType.startsWith("audio/") || 
              enclosureUrl.includes(".mp3") ||
              title.toLowerCase().includes("podcast") ||
              title.toLowerCase().includes("episode");
            
            const category = (isPodcast ? "podcasts" : "writing") as "writing" | "podcasts";
            
            const itunesDurNode = item.getElementsByTagName("itunes:duration")[0] || item.querySelector("duration");
            const audioDuration = itunesDurNode?.textContent || (isPodcast ? "35m" : undefined);

            return {
              id: guid || link || title,
              title,
              link,
              pubDate: pubDateStr,
              formattedDate,
              year,
              description,
              content,
              author,
              wordCount,
              readingTime,
              category,
              audioUrl: enclosureUrl || undefined,
              audioDuration,
            };
          });
          parsedPosts.push(...subsParsed);
        } catch (e: any) {
          console.error("Failed parsing Substack RSS: ", e);
          errorsList.push(`Substack Feed: ${e.message}`);
        }
      } else {
        errorsList.push("Substack feed served error or offline");
      }

      // 2. Process Podcast Feed
      if (podResponse.status === "fulfilled" && podResponse.value.ok) {
        try {
          const xmlText = await podResponse.value.text();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const items = xmlDoc.querySelectorAll("item");
          
          const podsParsed = Array.from(items).map((item) => {
            const guid = item.querySelector("guid")?.textContent || "";
            const title = item.querySelector("title")?.textContent || "Untitled Podcast Episode";
            const link = item.querySelector("link")?.textContent || "";
            const pubDateStr = item.querySelector("pubDate")?.textContent || "";
            const description = item.querySelector("description")?.textContent || "";
            
            let content = "";
            const contentNode = item.getElementsByTagName("content:encoded")[0] || item.getElementsByTagName("encoded")[0] || item.querySelector("encoded");
            if (contentNode) {
              content = contentNode.textContent || "";
            } else {
              content = description;
            }

            const creatorNode = item.getElementsByTagName("dc:creator")[0] || item.querySelector("creator") || item.querySelector("author");
            const author = creatorNode?.textContent || BRAND_NAME;

            const dateObj = new Date(pubDateStr);
            const year = isNaN(dateObj.getTime()) ? new Date().getFullYear() : dateObj.getFullYear();
            
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : pubDateStr;

            const cleanText = content.replace(/<[^>]*>/g, "");
            const words = cleanText.trim().split(/\s+/).filter((w) => w.length > 0);
            const wordCount = words.length;
            const readingTime = Math.max(1, Math.round(wordCount / 220));

            const enclosure = item.querySelector("enclosure");
            const enclosureUrl = enclosure?.getAttribute("url") || "";
            
            const category = "podcasts" as const;
            
            const itunesDurNode = item.getElementsByTagName("itunes:duration")[0] || item.querySelector("duration");
            const audioDuration = itunesDurNode?.textContent || "30m";

            return {
              id: guid || link || title,
              title,
              link,
              pubDate: pubDateStr,
              formattedDate,
              year,
              description,
              content,
              author,
              wordCount,
              readingTime,
              category,
              audioUrl: enclosureUrl || undefined,
              audioDuration,
            };
          });
          parsedPosts.push(...podsParsed);
        } catch (e: any) {
          console.error("Failed parsing Podcast RSS: ", e);
          errorsList.push(`Podcast Feed: ${e.message}`);
        }
      } else {
        errorsList.push("Podcast feed served error or offline");
      }

      // Validate we got something
      if (parsedPosts.length === 0) {
        throw new Error(errorsList.join(" | ") || "Failed to parse content from both feeds");
      }

      // Only use the parsed live posts from the RSS feeds
      const combined = [...parsedPosts];

      // Sort posts chronologically (newest publish dates at indices 0)
      combined.sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime();
        const dateB = new Date(b.pubDate).getTime();
        return dateB - dateA;
      });

      setPosts(combined);
    } catch (err: any) {
      console.error("Failed to parse RSS streams:", err);
      setError(err.message || "Failed to parse content from RSS feeds");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Chronological navigation utilities for post detail reading
  const activeIndex = posts.findIndex((p) => p.id === currentPostId);
  const activePost = activeIndex !== -1 ? posts[activeIndex] : null;

  // With newest posts at the front (descending order):
  // "Previous" chronological post is OLDER, which is at activeIndex + 1
  // "Next" chronological post is NEWER, which is at activeIndex - 1
  const hasPrev = activeIndex !== -1 && activeIndex < posts.length - 1;
  const hasNext = activeIndex > 0;

  const handlePrevPost = () => {
    if (hasPrev) {
      setCurrentPostId(posts[activeIndex + 1].id);
    }
  };

  const handleNextPost = () => {
    if (hasNext) {
      setCurrentPostId(posts[activeIndex - 1].id);
    }
  };

  // Filter posts passed down to listing component
  const displayedPosts = posts.filter(
    (post) => activeCategory === "all" || post.category === activeCategory
  );

  return (
    <div className="min-h-screen transition-colors duration-150">
      {/* Centered responsive container, using the full length of the site */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-16">
        
        {/* Header Branding Row on all pages */}
        <Header
          onBackToList={() => {
            setCurrentPostId(null);
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          hasPostActive={currentPostId !== null}
        />

        {/* Global Loading block spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-black">
            <Loader2 className="w-5 h-5 animate-spin text-black" />
            <p className="text-xs font-mono tracking-wider text-black">Loading creativity....</p>
          </div>
        ) : (
          <main className="space-y-6">
            {/* Error Banner when fetching failed - elegant and with fallback option */}
            {error && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dotted border-slate-300 dark:border-slate-800 rounded-md p-4 text-xs font-mono text-slate-800 dark:text-slate-300">
                <div className="space-y-2">
                  <p className="font-medium">RSS PROTOCOL FEED SYNCHRONIZATION ALERT:</p>
                  <p className="opacity-85">{error}</p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={fetchWritings}
                      className="flex items-center gap-1 bg-white hover:bg-slate-100 dark:bg-[#1a1a1a] dark:hover:bg-[#252525] border border-slate-300 dark:border-slate-800 px-2.5 py-1 rounded-sm select-none cursor-pointer text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3" />
                      <span>[Retry Live Sync]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main view switching logic */}
            {activePost ? (
              <PostReader
                post={activePost}
                onBackToList={() => {
                  setCurrentPostId(null);
                }}
                onPrevPost={handlePrevPost}
                onNextPost={handleNextPost}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />
            ) : (
              <div className="space-y-6">
                {/* Biography Board Visible Only When "all" is active */}
                {activeCategory === "all" && (
                  <AboutSection totalPosts={posts.filter((p) => p.category === "writing").length} />
                )}

                {/* Main chronological directory with indexing search filters */}
                <PostList
                  posts={displayedPosts}
                  onSelectPost={(id) => setCurrentPostId(id)}
                  activeCategory={activeCategory}
                />
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
