'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HTTP_METHODS, METHOD_COLORS } from '@/lib/constants';
import type { HttpMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface UrlBarProps {
  method: HttpMethod;
  url: string;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

export function UrlBar({ method, url, loading, onMethodChange, onUrlChange, onSend }: UrlBarProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={method} onValueChange={(v) => onMethodChange(v as HttpMethod)}>
        <SelectTrigger className={cn('w-[110px] font-mono font-bold', METHOD_COLORS[method])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HTTP_METHODS.map((m) => (
            <SelectItem key={m} value={m} className={cn('font-mono font-bold', METHOD_COLORS[m])}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <VariableHighlightInput
        value={url}
        onChange={onUrlChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter URL or paste {{variable}} template"
      />

      <Button onClick={onSend} disabled={loading} className="shrink-0">
        {loading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-1 h-4 w-4" />
        )}
        Send
      </Button>
    </div>
  );
}

function VariableHighlightInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="font-mono text-sm"
      />
    </div>
  );
}
