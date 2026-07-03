export {};

declare global {
  interface Window {
    // Two different Google scripts share this global at runtime: the Maps
    // JS API (client/src/components/Map.tsx) and Google Identity Services
    // (client/src/pages/Login.tsx). Neither's official types describe the
    // other, so this stays `any` rather than picking one and breaking the other.
    google: any;
  }
}
