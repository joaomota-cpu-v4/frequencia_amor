/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'vturb-smartplayer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { id?: string },
        HTMLElement
      >;
    }
  }
  interface Window {
    smartplayer?: any;
    fbq?: (...args: any[]) => void;
  }
}
