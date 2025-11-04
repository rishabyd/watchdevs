"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Search } from "@workspace/ui/icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim().length < 2) return;

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="w-lg"
        disabled={isPending}
      />
      <Button
        className="border-l-0"
        variant="outline"
        disabled={isPending}
        type="submit"
      >
        {isPending ? <Loader2 className="animate-spin size-4" /> : <Search />}
      </Button>
    </form>
  );
}
