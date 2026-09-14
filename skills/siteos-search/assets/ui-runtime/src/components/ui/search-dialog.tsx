"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recentSearches, suggestions } from "@/data/search";
import { BookOpen, FileText, X } from "lucide-react";

import { loadSiteOSSearchSuggestions, searchSiteOSProject, type SiteOSProjectSearchHit } from "@/lib/siteos-project-search";
import {
  buildSiteOSProjectSearchDialogSections,
  isSiteOSProjectSuggestionsState,
  resolveSiteOSProjectSearchTextParts,
  type SiteOSProjectSearchDialogCategory,
  type SiteOSProjectSearchDialogHighlightPart,
  type SiteOSProjectSearchDialogItem,
} from "@/lib/siteos-project-search-dialog";
import { cn } from "@/lib/utils";
import {
  canRecordSiteOSSearch,
  recordSiteOSSearch,
  subscribeSiteOSSearchConsent,
} from "@/lib/siteos-search-analytics";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type SearchItem = SiteOSProjectSearchDialogItem;

function mapRemoteSearchHitToItem(hit: SiteOSProjectSearchHit, index: number): SearchItem {
  return {
    id: index + 1,
    documentId: hit.id,
    title: hit.title,
    description: hit.snippet,
    icon: hit.sourceType === "docs" ? "book-open" : "file-text",
    category: hit.sourceType === "docs" ? "guide" : "tutorial",
    url: hit.url,
    sectionLabel: hit.sectionLabel,
    highlights: hit.highlights,
  };
}

function useSearch(query: string, open: boolean) {
  const search = searchSiteOSProject;
  const [data, setData] = useState<{
    query: string;
    results: SearchItem[];
    loading: boolean;
    error: boolean;
    total: number;
  }>({ query: "", results: [], loading: false, error: false, total: 0 });
  const [consentVersion, setConsentVersion] = useState(0);
  const [retryVersion, setRetryVersion] = useState(0);
  const [more, setMore] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const interaction = useRef<string | undefined>(undefined);
  const receipts = useRef(new Map<string, string>());
  useEffect(() => subscribeSiteOSSearchConsent(() => setConsentVersion((v) => v + 1)), []);
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    receipts.current.clear();
    let settle: ReturnType<typeof setTimeout> | undefined;
    const normalized = query.trim();
    setMore(false);
    if (!open || !normalized) {
      interaction.current = undefined;
      setData({
        query: normalized,
        results: [],
        loading: false,
        error: false,
        total: 0,
      });
      return () => abort.abort();
    }
    if (canRecordSiteOSSearch()) interaction.current ??= crypto.randomUUID();
    else interaction.current = undefined;
    setData({
      query: normalized,
      results: [],
      loading: true,
      error: false,
      total: 0,
    });
    const timer = setTimeout(async () => {
      try {
        const response = await search(normalized, {
          limit: 20,
          signal: abort.signal,
          interactionId: interaction.current,
        });
        if (abort.signal.aborted) return;
        if (!response.success) {
          setData({
            query: normalized,
            results: [],
            loading: false,
            error: true,
            total: 0,
          });
          return;
        }
        if (response.analyticsReceipt)
          for (const hit of response.hits) receipts.current.set(hit.id, response.analyticsReceipt);
        setData({
          query: normalized,
          results: response.hits.map(mapRemoteSearchHitToItem),
          loading: false,
          error: false,
          total: response.total,
        });
        settle = setTimeout(() => {
          if (!abort.signal.aborted) recordSiteOSSearch(response.analyticsReceipt);
        }, 500);
      } catch {
        if (!abort.signal.aborted)
          setData({
            query: normalized,
            results: [],
            loading: false,
            error: true,
            total: 0,
          });
      }
    }, 300);
    return () => {
      abort.abort();
      clearTimeout(timer);
      clearTimeout(settle);
    };
  }, [query, open, consentVersion, retryVersion, search]);
  async function loadMore() {
    const abort = controller.current;
    if (!abort || abort.signal.aborted || more || data.results.length >= data.total) return;
    setMore(true);
    try {
      const response = await search(query, {
        limit: 20,
        offset: data.results.length,
        signal: abort.signal,
        interactionId: interaction.current,
      });
      if (abort.signal.aborted) return;
      if (!response.success) {
        setData((previous) => ({ ...previous, error: true }));
        return;
      }
      if (response.analyticsReceipt)
        for (const hit of response.hits) receipts.current.set(hit.id, response.analyticsReceipt);
      setData((previous) => ({
        ...previous,
        error: false,
        total: response.hits.length ? response.total : previous.results.length,
        results: [
          ...previous.results,
          ...response.hits.map((hit, i) =>
            mapRemoteSearchHitToItem(hit, previous.results.length + i),
          ),
        ],
      }));
    } catch {
      if (!abort.signal.aborted) setData((previous) => ({ ...previous, error: true }));
    } finally {
      if (!abort.signal.aborted) setMore(false);
    }
  }
  return {
    results: data.query === query.trim() ? data.results : [],
    isLoading: data.loading || (Boolean(query.trim()) && data.query !== query.trim()),
    error: data.error && data.query === query.trim(),
    total: data.total,
    more,
    loadMore,
    retry: () => setRetryVersion((v) => v + 1),
    select: (item: SearchItem) => {
      if (item.documentId && data.query === query.trim())
        recordSiteOSSearch(receipts.current.get(item.documentId), item.documentId);
    },
  };
}

interface SearchInputProps {
  className?: string;
  query: string;
  setQuery: (value: string) => void;
}

const SearchInput = ({ query, setQuery, className }: SearchInputProps) => {
  return (
    <input
      className={cn(
        "w-full border-0 bg-transparent py-3.5 pr-16 pl-4 leading-snug tracking-tight outline-hidden remove-autocomplete-styles placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      type="text"
      placeholder="What are you searching for?"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      aria-label="Search site content"
      maxLength={500}
      autoComplete="off"
    />
  );
};

SearchInput.displayName = "SearchInput";

interface SearchHintItem extends Omit<SearchItem, "category" | "id"> {
  id?: number;
  category?: SiteOSProjectSearchDialogCategory;
}

interface SearchHintProps extends SearchHintItem {
  isSelected?: boolean;
  dataIndex: number;
  isLast?: boolean;
  onPointerMove: () => void;
  onSelect: () => void;
}

function SearchHint({
  url,
  title,
  description,
  icon,
  sectionLabel,
  highlights,
  isSelected,
  dataIndex,
  isLast,
  onPointerMove,
  onSelect,
}: SearchHintProps) {
  const isFirst = dataIndex === 0;
  const IconComponent = icon === "book-open" ? BookOpen : FileText;
  const titleParts = resolveSiteOSProjectSearchTextParts({
    text: title,
    highlights: highlights?.title,
  });
  const descriptionParts = resolveSiteOSProjectSearchTextParts({
    text: description,
    highlights: highlights?.snippet,
  });

  return (
    <Link
      className={cn(
        "group flex w-full cursor-pointer items-start gap-x-3 rounded-lg py-3 text-left outline-hidden transition-colors duration-150 hover:bg-foreground/5 focus-visible:bg-foreground/5 sm:pr-6 sm:pl-3",
        isSelected && "sm:bg-foreground/5",
        isFirst && "scroll-mt-12",
        !isFirst && !isLast && "scroll-my-2",
        isLast && "scroll-mb-5",
      )}
      href={url}
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") onPointerMove();
      }}
      onClick={onSelect}
      tabIndex={-1}
      data-index={dataIndex}
    >
      <IconComponent
        className={cn(
          "hidden mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground sm:inline-block",
          isSelected && "sm:text-foreground",
        )}
      />
      <div className="flex min-w-0 flex-col">
        <p className="line-clamp-2 max-w-full text-sm leading-5 font-semibold text-popover-foreground">
          <HighlightedText parts={titleParts} />
        </p>
        {sectionLabel ? (
          <span className="mt-1 text-xs leading-4 font-normal text-muted-foreground">
            {sectionLabel}
          </span>
        ) : null}
        {description ? (
          <p className="mt-2 max-w-full text-[0.8125rem] leading-5 font-normal break-words text-popover-foreground/80">
            <HighlightedText parts={descriptionParts} />
          </p>
        ) : null}
      </div>
    </Link>
  );
}

interface SearchGroupProps<T extends SearchHintItem> {
  title?: string;
  items: T[];
  startIndex: number;
  selectedIndex: number | null;
  totalItems: number;
  onItemChange: (index: number) => void;
  onSelectItem: (item: T) => void;
}

function HighlightedText(props: { parts: SiteOSProjectSearchDialogHighlightPart[] }) {
  return (
    <>
      {props.parts.map((part, index) =>
        part.matched ? (
          <mark
            key={index}
            className="rounded-sm bg-primary/20 px-0.5 font-semibold text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function SearchGroup<T extends SearchHintItem>({
  title,
  items,
  startIndex,
  selectedIndex,
  totalItems,
  onItemChange,
  onSelectItem,
}: SearchGroupProps<T>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-3">
      {title ? (
        <h3 className="text-[0.8125rem] leading-none font-medium tracking-tight text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <ul>
        {items.map((item, index) => {
          const itemIndex = startIndex + index;
          const isSearchItem = "category" in item;

          return (
            <li key={isSearchItem ? `${(item as SearchItem).category}-${index}` : `item-${index}`}>
              <SearchHint
                {...item}
                isSelected={selectedIndex === itemIndex}
                isLast={itemIndex === totalItems - 1}
                dataIndex={itemIndex}
                onPointerMove={() => onItemChange(itemIndex)}
                onSelect={() => onSelectItem(item)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const NoResultsFound = () => (
  <p className="pt-3 text-center text-sm leading-tight font-medium tracking-tight text-muted-foreground">
    No results found.
  </p>
);

interface SearchDialogProps {
  open: boolean;
  onSelectResult: () => void;
}

export default function SearchDialog({ open, onSelectResult }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const state = useSearch(query, open);
  const [hostedSuggestions, setHostedSuggestions] = useState<SearchItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    setSuggestionsLoading(true);
    void loadSiteOSSearchSuggestions(abort.signal).then((result) => {
      if (abort.signal.aborted) return;
      setHostedSuggestions(result?.configured ? result.items.map((item,index) => ({
        id:index+1,documentId:item.id,title:item.title,url:item.url,description:item.snippet,
        sectionLabel:item.sectionLabel,icon:"book-open",category:"documentation",
      })) : result ? suggestions : []);
      setSuggestionsLoading(false);
    });
    return () => abort.abort();
  }, [open]);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <SearchDialogView
      {...state}
      open={open}
      query={query}
      setQuery={setQuery}
      recentSearches={recentSearches}
      suggestions={suggestionsLoading ? [] : hostedSuggestions}
      isLoading={state.isLoading || (!query.trim() && suggestionsLoading)}
      onSelectResult={onSelectResult}
    />
  );
}

// This controlled view is also the visual catalog surface. Fetching and analytics
// stay in the wrapper so previews and host customizations use the same markup.
export interface SearchDialogViewProps extends SearchDialogProps {
  query: string;
  setQuery: (query: string) => void;
  results: SearchItem[];
  recentSearches: SearchItem[];
  suggestions: SearchItem[];
  isLoading: boolean;
  error: boolean;
  total: number;
  more: boolean;
  loadMore: () => void;
  retry: () => void;
  select: (item: SearchItem) => void;
}

export function SearchDialogView({
  open,
  onSelectResult,
  query,
  setQuery,
  results,
  recentSearches,
  suggestions,
  isLoading,
  error,
  total,
  more,
  loadMore,
  retry,
  select,
}: SearchDialogViewProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollFromKeyboard = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isTouchDevice = useTouchDevice();

  const allItems = useCallback((): { item: SearchItem; index: number }[] => {
    const sections = buildSiteOSProjectSearchDialogSections({
      query,
      recentSearches,
      suggestions,
      results,
    });

    return sections.flatMap((section, sectionIndex) =>
      section.items.map((item, index) => ({
        item,
        index:
          sections
            .slice(0, sectionIndex)
            .reduce((sum, candidate) => sum + candidate.items.length, 0) + index,
      })),
    );
  }, [query, results, recentSearches, suggestions]);

  const items = allItems();
  const totalItems = items.length;

  useEffect(() => {
    if (!open) {
      scrollFromKeyboard.current = false;
      setSelectedIndex(null);
    }
  }, [open]);

  useEffect(() => {
    scrollFromKeyboard.current = false;
    setSelectedIndex(null);
  }, [results, query]);

  useEffect(() => {
    if (!scrollFromKeyboard.current) return;
    scrollFromKeyboard.current = false;
    if (isTouchDevice || selectedIndex === null) {
      return;
    }

    const selectedElement = dialogRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (!selectedElement) {
      return;
    }

    const blockOption: ScrollLogicalPosition =
      selectedIndex === 0 ? "start" : selectedIndex === totalItems - 1 ? "end" : "nearest";
    selectedElement.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: blockOption,
    });
  }, [isTouchDevice, selectedIndex, totalItems]);

  const selectWithPointer = (index: number) => {
    scrollFromKeyboard.current = false;
    setSelectedIndex(index);
  };

  const handleOpenAutoFocus = (event: Event) => {
    if (isTouchDevice) {
      event.preventDefault();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.target as HTMLElement).tagName !== "INPUT") return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (totalItems > 0 && (selectedIndex === null || selectedIndex < totalItems - 1)) {
        scrollFromKeyboard.current = true;
        setSelectedIndex(selectedIndex === null ? 0 : selectedIndex + 1);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (totalItems > 0 && (selectedIndex === null || selectedIndex > 0)) {
        scrollFromKeyboard.current = true;
        setSelectedIndex(selectedIndex === null ? totalItems - 1 : selectedIndex - 1);
      }
      return;
    }

    if (event.key === "Enter" && selectedIndex !== null) {
      event.preventDefault();
      const selectedElement = dialogRef.current?.querySelector(
        `[data-index="${selectedIndex}"]`,
      ) as HTMLElement | null;
      selectedElement?.click();
      return;
    }

    if (event.key === "Escape") {
      setSelectedIndex(null);
    }
  };

  const renderSearchResults = () => {
    if (results.length === 0) {
      return <NoResultsFound />;
    }

    const sections = buildSiteOSProjectSearchDialogSections({
      query,
      recentSearches: [],
      suggestions: [],
      results,
    });

    let startIndex = 0;
    return (
      <>
        {sections.map((section, sectionIndex) => {
          const group = (
            <SearchGroup
              key={`${section.title}-${sectionIndex}`}
              title={section.title}
              items={section.items}
              startIndex={startIndex}
              selectedIndex={selectedIndex}
              totalItems={totalItems}
              onItemChange={selectWithPointer}
              onSelectItem={(item) => {
                select(item);
                onSelectResult();
              }}
            />
          );
          startIndex += section.items.length;
          return group;
        })}
      </>
    );
  };

  return (
    <DialogContent
      ref={dialogRef}
      className="top-auto bottom-0 h-[75dvh] w-full max-w-(--breakpoint-sm) translate-y-0 rounded-t-xl p-0 shadow-none outline-hidden data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-bottom-1/2 sm:top-[20dvh] sm:bottom-auto sm:h-auto sm:rounded-lg sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-1 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-1"
      onOpenAutoFocus={handleOpenAutoFocus}
    >
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">Search site content.</DialogDescription>
      <div className="relative flex flex-col" onKeyDown={handleKeyDown}>
        <SearchInput query={query} setQuery={setQuery} />
        <DialogClose asChild>
          <Button
            className={cn(
              "absolute top-3.5 right-4 rounded border border-muted outline-hidden",
              isTouchDevice && "top-2",
            )}
            variant="outline"
            size={isTouchDevice ? "icon" : "xs"}
          >
            <span className="sr-only">Close search</span>
            {isTouchDevice ? (
              <X aria-hidden />
            ) : (
              <span className="text-xs leading-none tracking-tight" aria-hidden>
                Esc
              </span>
            )}
          </Button>
        </DialogClose>

        <ScrollArea className="max-h-[calc(75dvh-3.125rem)] sm:max-h-[min(calc(40rem-3.5rem),calc(60dvh-3.5rem))]">
          <div className="relative flex min-h-20 flex-col gap-y-5 overflow-hidden px-4 py-5">
            {!isLoading && !error && query.trim() && (
              <p role="status" className="text-xs text-muted-foreground">
                {total.toLocaleString()} {total === 1 ? "result" : "results"} for “{query.trim()}”
              </p>
            )}
            {isLoading ? (
              <div className="flex justify-center pt-3">
                <div
                  role="status"
                  aria-label="Searching"
                  className="size-5 motion-reduce:animate-none animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
                />
              </div>
            ) : null}

            {!isLoading && isSiteOSProjectSuggestionsState(query) ? (
              <>
                <SearchGroup
                  title="Recent"
                  items={recentSearches}
                  startIndex={0}
                  selectedIndex={selectedIndex}
                  totalItems={totalItems}
                  onItemChange={selectWithPointer}
                  onSelectItem={onSelectResult}
                />
                <SearchGroup
                  title="Suggestions"
                  items={suggestions}
                  startIndex={recentSearches.length}
                  selectedIndex={selectedIndex}
                  totalItems={totalItems}
                  onItemChange={selectWithPointer}
                  onSelectItem={onSelectResult}
                />
              </>
            ) : null}

            {!isLoading && error && (
              <div role="alert" className="flex flex-col items-center gap-3 py-3 text-sm">
                <p>Search is temporarily unavailable.</p>
                <Button variant="outline" onClick={results.length ? () => void loadMore() : retry}>
                  Try again
                </Button>
              </div>
            )}
            {!isLoading && query && (!error || results.length > 0) ? renderSearchResults() : null}
            {!isLoading &&
              query &&
              results.length > 0 &&
              results.length < total &&
              results.length < 10_000 && (
                <Button variant="outline" disabled={more} onClick={() => void loadMore()}>
                  {more ? "Loading…" : `More results (${results.length} of ${total})`}
                </Button>
              )}
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  );
}
