"use client";

import { useState } from "react";
import { FiChevronDown, FiFilter, FiSearch } from "react-icons/fi";

import { useAssistant } from "@/features/assistant/components/assistant-provider";
import {
  buildGmailQuery,
  countActiveFilters,
  describeMailFilters,
  emptyMailFilters,
  type MailFilters,
  type MailReadStatus,
} from "@/features/mail/lib/build-gmail-query";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@/shared/ui";

const STATUS_LABELS: Record<MailReadStatus, string> = {
  all: "All",
  unread: "Unread",
  read: "Read",
};

export function MailSearchFilters() {
  const { executeSearch, clearSearch } = useAssistant();
  const [keyword, setKeyword] = useState("");
  const [appliedFilters, setAppliedFilters] =
    useState<MailFilters>(emptyMailFilters);
  const [draftFilters, setDraftFilters] =
    useState<MailFilters>(emptyMailFilters);
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = countActiveFilters(appliedFilters);

  const runSearch = (filters: MailFilters, keywordValue: string) => {
    const query = buildGmailQuery(keywordValue, filters);

    if (!query.trim()) {
      clearSearch();
      return;
    }

    void executeSearch(query, describeMailFilters(keywordValue, filters));
  };

  const handleKeywordKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch(appliedFilters, keyword);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftFilters(appliedFilters);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setIsOpen(false);
    runSearch(draftFilters, keyword);
  };

  const handleClear = () => {
    setDraftFilters(emptyMailFilters);
    setAppliedFilters(emptyMailFilters);
    setKeyword("");
    setIsOpen(false);
    clearSearch();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <FiSearch
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={handleKeywordKeyDown}
          placeholder="Search emails..."
          aria-label="Search emails"
          className="h-9 bg-background pl-9"
        />
      </div>

      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
          >
            <FiFilter className="size-4" aria-hidden />
            Filter
            {activeFilterCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1 text-xs"
              >
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4">
          <p className="text-sm font-medium">Filter messages</p>

          <div className="space-y-1.5">
            <Label htmlFor="filter-sender" className="text-xs">
              From
            </Label>
            <Input
              id="filter-sender"
              value={draftFilters.sender}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  sender: event.target.value,
                }))
              }
              placeholder="Sender name or email"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-between font-normal"
                >
                  {STATUS_LABELS[draftFilters.readStatus]}
                  <FiChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {(Object.keys(STATUS_LABELS) as MailReadStatus[]).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status}
                      onSelect={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          readStatus: status,
                        }))
                      }
                    >
                      {STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-date-from" className="text-xs">
                Date from
              </Label>
              <Input
                id="filter-date-from"
                type="date"
                value={draftFilters.dateFrom}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-date-to" className="text-xs">
                Date to
              </Label>
              <Input
                id="filter-date-to"
                type="date"
                value={draftFilters.dateTo}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
