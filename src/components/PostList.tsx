import { useState } from "react";
import { SubstackPost } from "../types";
import { Search, Shuffle, Mic, BookOpen, Clock } from "lucide-react";

interface PostListProps {
  posts: SubstackPost[];
  onSelectPost: (postId: string) => void;
  activeCategory: "all" | "writing" | "podcasts";
}

export default function PostList({ posts, onSelectPost, activeCategory }: PostListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q)
    );
  });

  // Group filtered posts by year
  const postsByYear = filteredPosts.reduce<{ [year: number]: SubstackPost[] }>(
    (acc, post) => {
      const year = post.year || new Date(post.pubDate).getFullYear() || 2026;
      if (!acc[year]) acc[year] = [];
      acc[year].push(post);
      return acc;
    },
    {}
  );

  // Sort years in descending order
  const sortedYears = Object.keys(postsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // Function to select a random post
  const selectRandomPost = () => {
    if (filteredPosts.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredPosts.length);
      onSelectPost(filteredPosts[randomIndex].id);
    }
  };

  // Human-readable category display
  const getCategoryTitle = () => {
    if (activeCategory === "writing") return "All Writing";
    if (activeCategory === "podcasts") return "Ayush Prakash Podcast";
    return "All Creativity";
  };

  return (
    <div className="space-y-10">
      {/* Filtering and Utility Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-3 border-b border-dotted border-black">
        <div className="text-sm font-mono font-medium uppercase tracking-wider text-black flex items-center gap-2">
          {activeCategory === "podcasts" ? (
            <Mic className="w-4 h-4 text-black" />
          ) : (
            <BookOpen className="w-4 h-4 text-black" />
          )}
          <span>{getCategoryTitle()} ({filteredPosts.length})</span>
        </div>

        {/* Action controllers */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-7 py-1.5 sm:py-1 w-full sm:w-48 text-[13px] bg-transparent border border-black rounded-sm focus:outline-none text-black placeholder-black/50 font-sans"
              id="search-input"
            />
            <Search className="w-3.5 h-3.5 text-black absolute right-2.5 top-2.5 sm:top-2 pointer-events-none" />
          </div>

          <button
            onClick={selectRandomPost}
            className="flex items-center justify-center gap-1 px-3 py-1.5 sm:py-1 text-xs font-mono border border-black text-black bg-transparent hover:bg-black hover:text-white rounded-sm transition-all cursor-pointer whitespace-nowrap min-h-[34px] sm:min-h-[28px]"
            title="Read a random essay"
            id="random-shuffle-btn"
          >
            <Shuffle className="w-3 h-3 text-current" />
            <span>Surprise Me</span>
          </button>
        </div>
      </div>

      {searchQuery && (
        <div className="text-xs font-mono text-black font-medium -mt-4">
          Matching query &ldquo;{searchQuery}&rdquo;: {filteredPosts.length} entries
        </div>
      )}

      {/* Retro Chronological Listings grouped by Year */}
      <div className="space-y-12">
        {sortedYears.length > 0 ? (
          sortedYears.map((year) => (
            <section key={year} className="space-y-6">
              {/* Retro Year Title */}
              <div className="text-lg font-mono font-medium text-black select-none pb-1.5 border-b border-dotted border-black">
                {year}
              </div>

              {/* Stacked entries - NO tables, NO bullet symbols. Just Date on top, Title below! */}
              <div className="space-y-8 pl-1">
                {postsByYear[year].map((post) => {
                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col items-start gap-1"
                      id={`post-item-${post.id}`}
                    >
                      {/* 1. Date and content badge on top line */}
                      <div className="flex flex-wrap items-center gap-2 select-none">
                        <span className="text-xs font-mono text-black font-medium tracking-wider">
                          {post.formattedDate}
                        </span>
                        <span className="text-black/35 font-mono text-xs">•</span>
                        {post.category === "podcasts" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium border border-black/30 text-black leading-none bg-transparent" id={`post-tag-${post.id}`}>
                            Podcast • {post.audioDuration || "30m"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium border border-black/30 text-black leading-none bg-transparent" id={`post-tag-${post.id}`}>
                            Writing • {post.readingTime}m
                          </span>
                        )}
                      </div>

                      {/* 2. Link Title immediately below */}
                      <button
                        onClick={() => onSelectPost(post.id)}
                        className="text-left font-sans text-xl md:text-[22px] font-medium text-black hover:underline decoration-1 cursor-pointer leading-tight tracking-tight block transition-colors mt-0.5"
                      >
                        {post.title}
                      </button>

                      {/* Explicit clean layout distance spacing - silence */}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 border border-dotted border-black rounded-sm">
            <p className="text-sm font-sans text-black font-medium">
              No publications found under this filter for &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Archive Statistics Panel */}
      <footer className="pt-10 text-[11px] font-mono text-black font-medium border-t border-dotted border-black flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          ARCHIVE METRICS: {posts.length} EPISODES & WRITINGS ON SOURCE FEED
        </div>
        <div>
          LAST DATA RECOVERY REFRESH: {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
        </div>
      </footer>
    </div>
  );
}

