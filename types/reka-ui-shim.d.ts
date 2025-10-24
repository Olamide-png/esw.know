// types/reka-ui-shim.d.ts
declare module 'reka-ui' {
  // Expand these as needed for other components.
  export interface ScrollAreaScrollbarProps {
    orientation?: 'vertical' | 'horizontal'
  }
  export interface ScrollAreaProps {
    type?: 'auto' | 'always' | 'scroll' | 'hover'
  }
  export interface ScrollAreaViewportProps {}
  export interface ScrollAreaThumbProps {}
}



