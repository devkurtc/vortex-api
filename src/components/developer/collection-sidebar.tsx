'use client';

import { useState } from 'react';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { METHOD_COLORS } from '@/lib/constants';
import type { Collection, CollectionFolder, ApiRequest, HttpMethod, RequestTab } from '@/lib/types';
import { ChevronDown, ChevronRight, FolderOpen, Folder, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CollectionSidebar() {
  const collections = useCollectionStore((s) => s.collections);
  const openTab = useUiStore((s) => s.openTab);

  function handleRequestClick(request: ApiRequest) {
    const tab: RequestTab = {
      id: `tab-${request.id}`,
      requestId: request.id,
      name: request.name,
      method: request.method,
      isDirty: false,
    };
    openTab(tab);
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Collections</span>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {collections.map((col) => (
            <CollectionTree key={col.id} collection={col} onRequestClick={handleRequestClick} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function CollectionTree({
  collection,
  onRequestClick,
}: {
  collection: Collection;
  onRequestClick: (req: ApiRequest) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  // Find requests not in any folder
  const folderRequestIds = new Set(collection.folders.flatMap((f) => f.requests));
  const rootRequests = collection.requests.filter((r) => !folderRequestIds.has(r.id));

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-sm font-medium hover:bg-muted"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="truncate">{collection.name}</span>
      </button>

      {expanded && (
        <div className="ml-2">
          {collection.folders.map((folder) => (
            <FolderTree
              key={folder.id}
              folder={folder}
              requests={collection.requests}
              onRequestClick={onRequestClick}
            />
          ))}
          {rootRequests.map((req) => (
            <RequestItem key={req.id} request={req} onClick={() => onRequestClick(req)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderTree({
  folder,
  requests,
  onRequestClick,
}: {
  folder: CollectionFolder;
  requests: ApiRequest[];
  onRequestClick: (req: ApiRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const folderRequests = folder.requests
    .map((id) => requests.find((r) => r.id === id))
    .filter(Boolean) as ApiRequest[];

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-muted"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <>
            <ChevronDown className="h-3 w-3 shrink-0" />
            <FolderOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
          </>
        ) : (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Folder className="h-3 w-3 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{folder.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{folderRequests.length}</span>
      </button>
      {expanded && (
        <div className="ml-4">
          {folderRequests.map((req) => (
            <RequestItem key={req.id} request={req} onClick={() => onRequestClick(req)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestItem({
  request,
  onClick,
}: {
  request: ApiRequest;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
      onClick={onClick}
    >
      <span className={cn('shrink-0 text-[10px] font-bold uppercase', METHOD_COLORS[request.method as HttpMethod])}>
        {request.method.slice(0, 3)}
      </span>
      <span className="truncate text-left">{request.name}</span>
    </button>
  );
}
