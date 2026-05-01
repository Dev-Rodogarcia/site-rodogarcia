import { storagePaths } from "../config/storagePaths.js";
import type { ContentData } from "../types/content.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

const DEFAULT_CONTENT: ContentData = {
  heroSlides: [],
  dnaSlides: [],
  feedbacks: [],
  vagas: [],
  units: [],
};

type RawItem = Record<string, unknown> & { order?: number };

function sortByOrder(items: RawItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export const contentRepository = {
  read(): ContentData {
    const data = readJsonFile<ContentData>(storagePaths.content, DEFAULT_CONTENT);
    return {
      heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
      dnaSlides: Array.isArray(data.dnaSlides) ? data.dnaSlides : [],
      vagas: Array.isArray(data.vagas) ? data.vagas : [],
      feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : [],
      units: Array.isArray(data.units) ? data.units : [],
    };
  },
  write(content: ContentData): void {
    const rawContent = content as unknown as Record<string, RawItem[]>;
    writeJsonFile(storagePaths.content, {
      heroSlides: sortByOrder(
        Array.isArray(rawContent.heroSlides) ? rawContent.heroSlides : []
      ),
      dnaSlides: sortByOrder(
        Array.isArray(rawContent.dnaSlides) ? rawContent.dnaSlides : []
      ),
      vagas: sortByOrder(Array.isArray(rawContent.vagas) ? rawContent.vagas : []),
      feedbacks: sortByOrder(
        Array.isArray(rawContent.feedbacks) ? rawContent.feedbacks : []
      ),
      units: sortByOrder(Array.isArray(rawContent.units) ? rawContent.units : []),
    });
  },
};

export const siteTextsRepository = {
  read(): Record<string, string> {
    return readJsonFile<Record<string, string>>(storagePaths.siteTexts, {});
  },
  write(data: Record<string, string>): void {
    writeJsonFile(storagePaths.siteTexts, data);
  },
};
