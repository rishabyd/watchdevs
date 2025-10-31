"use client";

import { Input } from "@workspace/ui/components/input";
import { Loader2Icon, LoaderIcon } from "@workspace/ui/icons";
import Link from "next/link";
import { useState, useRef } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; user: { name: string } }>
  >([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (q: string) => {
    setQuery(q);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Clear search when clicking a result
  const handleResultClick = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="flex justify-center items-center">
        <Input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search videos, creators..."
          className="w-xl px-4 py-2 border rounded-none"
        />

        {loading && (
          <div className=" absolute z-10  -right-9">
            <LoaderIcon className="animate-spin" />
          </div>
        )}
      </div>
      {results.length > 0 && !loading && (
        <div className="absolute top-full left-0 right-0 bg-background border mt-1 max-h-96 overflow-y-auto z-10 shadow-lg">
          {results.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              onClick={handleResultClick}
              className="px-4 py-2 flex hover:bg-accent/50 duration-300 border-b last:border-b-0"
            >
              <div className="font-semibold truncate">{video.title} by </div>
              <div className="text-sm text-gray-600">{video.user.name}</div>
            </Link>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 bg-background border mt-1 px-4 py-2 text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
}
