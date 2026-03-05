'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnvironmentStore } from '@/lib/stores/environment-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { Globe, Eye, EyeOff } from 'lucide-react';

export function EnvironmentSwitcher() {
  const environments = useEnvironmentStore((s) => s.environments);
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);
  const variablesPanelOpen = useUiStore((s) => s.variablesPanelOpen);
  const toggleVariablesPanel = useUiStore((s) => s.toggleVariablesPanel);

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={activeEnvironmentId || ''} onValueChange={setActiveEnvironment}>
        <SelectTrigger className="h-8 w-[200px]">
          <SelectValue placeholder="No Environment" />
        </SelectTrigger>
        <SelectContent>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id}>
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleVariablesPanel}
            >
              {variablesPanelOpen ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{variablesPanelOpen ? 'Hide' : 'Show'} variables & console</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
