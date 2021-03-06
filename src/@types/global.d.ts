declare global {
  interface Window {
    api: Sandbox;
  }
}

export interface Sandbox {
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, listener: (...args: unknown[]) => void) => void;
  receiveOnce: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
}

export {}
