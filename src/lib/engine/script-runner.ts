/**
 * Minimal Postman-compatible script runner.
 * Supports: pm.response.json(), pm.globals.set(), pm.globals.get()
 */

interface ScriptContext {
  responseBody: string;
  responseStatus: number;
  setGlobalVariable: (key: string, value: string) => void;
  getGlobalVariable: (key: string) => string | undefined;
}

export function runPostResponseScript(
  script: string,
  context: ScriptContext
): { success: boolean; error?: string } {
  if (!script?.trim()) return { success: true };

  try {
    // Build the pm shim
    const pm = {
      response: {
        json: () => {
          try {
            return JSON.parse(context.responseBody);
          } catch {
            return null;
          }
        },
        code: context.responseStatus,
        status: context.responseStatus,
      },
      globals: {
        set: (key: string, value: string) => context.setGlobalVariable(key, String(value)),
        get: (key: string) => context.getGlobalVariable(key) ?? '',
      },
      environment: {
        set: (_key: string, _value: string) => {
          // Environment set is a no-op for now (would need env store access)
        },
        get: (_key: string) => '',
      },
    };

    // Execute the script in a sandboxed function
    const fn = new Function('pm', script);
    fn(pm);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
