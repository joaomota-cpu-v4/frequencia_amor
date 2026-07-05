/// <reference types="vite/client" />

import type React from 'react';

type FacebookPixel = (
  command: string,
  pixelIdOrEvent: string,
  eventOrParameters?: string | Record<string, unknown>,
  parametersOrOptions?: Record<string, unknown>,
  options?: Record<string, unknown>
) => void;

declare global {
  interface SmartPlayerInstance {
    video?: HTMLVideoElement;
    on: (event: 'timeupdate' | 'ended', handler: () => void) => void;
    off?: (event: 'timeupdate' | 'ended', handler: () => void) => void;
  }

  namespace JSX {
    interface IntrinsicElements {
      'vturb-smartplayer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { id?: string },
        HTMLElement
      >;
    }
  }
  interface Window {
    smartplayer?: { instances?: SmartPlayerInstance[] };
    fbq?: FacebookPixel;
  }
}

export {};
