"use client";

import { Suspense } from "react";
import SearchContent from "./content";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-ueno-blue border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
