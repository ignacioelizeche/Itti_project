"use client";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import SearchContent from "./content";

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="h-64" />}>
      <SearchContent />
    </Suspense>
  );
}
