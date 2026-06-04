export interface SubstackPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  formattedDate: string;
  year: number;
  description: string;
  content: string;
  author: string;
  wordCount: number;
  readingTime: number; // estimated in minutes
  category: "writing" | "podcasts";
  audioUrl?: string; // Optional audio URL for podcasts
  audioDuration?: string; // e.g. "42:15"
}

export type ViewMode = "list" | "post";
