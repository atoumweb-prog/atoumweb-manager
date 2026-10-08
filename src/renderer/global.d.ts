import type { AtoumWebApi } from '../shared/contracts';

declare global {
  interface Window {
    atoumweb: AtoumWebApi;
  }
}

export {};
