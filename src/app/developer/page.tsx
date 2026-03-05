'use client';

import { useUiStore } from '@/lib/stores/ui-store';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { RequestTabs } from '@/components/developer/request-tabs';
import { RequestBuilder } from '@/components/developer/request-builder';
import { ResponseViewer } from '@/components/developer/response-viewer';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';

export default function DeveloperPage() {
  const activeTab = useUiStore((s) => s.activeTab);
  const tabs = useUiStore((s) => s.tabs);
  const responses = useUiStore((s) => s.responses);
  const collections = useCollectionStore((s) => s.collections);

  const currentTab = tabs.find((t) => t.id === activeTab);
  const response = activeTab ? responses[activeTab] ?? null : null;

  // Find which collection owns this request
  let ownerCollectionId: string | null = null;
  if (currentTab) {
    for (const col of collections) {
      if (col.requests.some((r) => r.id === currentTab.requestId)) {
        ownerCollectionId = col.id;
        break;
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <RequestTabs />

      {currentTab && ownerCollectionId ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Request Builder (top half) */}
          <div className="overflow-auto" style={{ flex: '1 1 50%' }}>
            <RequestBuilder collectionId={ownerCollectionId} requestId={currentTab.requestId} />
          </div>

          <Separator />

          {/* Response Viewer (bottom half) */}
          <div className="overflow-auto" style={{ flex: '1 1 50%' }}>
            <ResponseViewer response={response} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Zap className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No request selected</p>
            <p className="mt-1 text-sm">
              Click a request in the sidebar to open it, or create a new one
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
