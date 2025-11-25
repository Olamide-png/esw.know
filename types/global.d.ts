// types/global.d.ts
import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}
export {};
