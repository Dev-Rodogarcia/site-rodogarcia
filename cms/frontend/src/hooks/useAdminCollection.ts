"use client";

import { useCallback, useEffect, useState } from "react";
import { adminResourceKeys, invalidateAdminResource } from "./useAdminResource";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api } from "@/lib/routes";

interface OrderedItem {
  id: string;
  order?: number;
}

interface UseAdminCollectionOptions<TItem> {
  normalize?: (item: Record<string, unknown>) => TItem;
}

function sortByOrder<TItem extends OrderedItem>(items: TItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function useAdminCollection<TItem extends OrderedItem>(
  entity: string,
  options: UseAdminCollectionOptions<TItem> = {}
) {
  const { apiRequest } = useApiRequest();
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const normalizeOption = options.normalize;

  const normalize = useCallback(
    (item: Record<string, unknown>) =>
      (normalizeOption ? normalizeOption(item) : (item as TItem)),
    [normalizeOption]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await apiRequest<{ items?: Record<string, unknown>[] }>(
      api.admin.entity(entity)
    );

    if (!response.success) {
      setItems([]);
      setError(response.error ?? "Erro ao carregar dados.");
      setLoading(false);
      return;
    }

    setItems(sortByOrder((response.data?.items ?? []).map(normalize)));
    setLoading(false);
  }, [apiRequest, entity, normalize]);

  useEffect(() => {
    void load();
  }, [load]);

  const createItem = useCallback(
    async (payload: Record<string, unknown>) => {
      const response = await apiRequest<{ items?: Record<string, unknown>[] }>(
        api.admin.entity(entity),
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (response.success && response.data?.items) {
        setItems(sortByOrder(response.data.items.map(normalize)));
        invalidateAdminResource(adminResourceKeys.dashboard);
      }

      return response;
    },
    [apiRequest, entity, normalize]
  );

  const updateItem = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      const response = await apiRequest<{ items?: Record<string, unknown>[] }>(
        api.admin.entityItem(entity, id),
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (response.success && response.data?.items) {
        setItems(sortByOrder(response.data.items.map(normalize)));
        invalidateAdminResource(adminResourceKeys.dashboard);
      }

      return response;
    },
    [apiRequest, entity, normalize]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const response = await apiRequest<{ items?: Record<string, unknown>[] }>(
        api.admin.entityItem(entity, id),
        {
          method: "DELETE",
        }
      );

      if (response.success && response.data?.items) {
        setItems(sortByOrder(response.data.items.map(normalize)));
        invalidateAdminResource(adminResourceKeys.dashboard);
      }

      return response;
    },
    [apiRequest, entity, normalize]
  );

  const reorderItems = useCallback(
    async (orderedIds: string[]) => {
      const response = await apiRequest<{ items?: Record<string, unknown>[] }>(
        api.admin.reorder(entity),
        {
          method: "POST",
          body: JSON.stringify({ orderedIds }),
        }
      );

      if (response.success && response.data?.items) {
        setItems(sortByOrder(response.data.items.map(normalize)));
        invalidateAdminResource(adminResourceKeys.dashboard);
      }

      return response;
    },
    [apiRequest, entity, normalize]
  );

  const moveItem = useCallback(
    async (id: string, direction: -1 | 1) => {
      const currentIndex = items.findIndex((item) => item.id === id);
      const targetIndex = currentIndex + direction;

      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
        return { success: false, error: "Movimento invalido." };
      }

      const ordered = [...items];
      const [selected] = ordered.splice(currentIndex, 1);
      ordered.splice(targetIndex, 0, selected);

      return reorderItems(ordered.map((item) => item.id));
    },
    [items, reorderItems]
  );

  return {
    items,
    setItems,
    loading,
    error,
    load,
    createItem,
    updateItem,
    removeItem,
    reorderItems,
    moveItem,
  };
}
