declare module 'react-katex' {
  import type { ComponentProps, FC } from 'react';

  interface KaTeXProps extends ComponentProps<'span'> {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }

  export const BlockMath: FC<KaTeXProps>;
  export const InlineMath: FC<KaTeXProps>;
}
