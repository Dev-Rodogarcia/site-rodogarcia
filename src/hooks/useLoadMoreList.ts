"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_BATCH_SIZE = 12;

export function useLoadMoreList<T>(items: T[], batchSize = DEFAULT_BATCH_SIZE) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [items, batchSize]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const hasMore = visibleCount < items.length;
  const remainingCount = Math.max(items.length - visibleCount, 0);

  function showMore() {
    setVisibleCount((current) => Math.min(items.length, current + batchSize));
  }

  function showAll() {
    setVisibleCount(items.length);
  }

  return {
    visibleItems,
    visibleCount,
    totalCount: items.length,
    hasMore,
    remainingCount,
    showMore,
    showAll,
  };
}
