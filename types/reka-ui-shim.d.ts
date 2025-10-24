// types/reka-ui-shim.d.ts
declare module 'reka-ui' {
  // Extend these if other components need more types.
  export interface ScrollAreaScrollbarProps {
    orientation?: 'vertical' | 'horizontal'
  }
  export interface ScrollAreaProps {
    type?: 'auto' | 'always' | 'scroll' | 'hover'
  }
  export interface ScrollAreaViewportProps {}
  export interface ScrollAreaThumbProps {}
}


