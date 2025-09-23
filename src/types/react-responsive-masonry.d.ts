declare module 'react-responsive-masonry' {
  import { ReactNode } from 'react';

  interface MasonryProps {
    columnsCount: number;
    gutter?: string | number;
    className?: string;
    children: ReactNode;
  }

  const Masonry: React.FC<MasonryProps>;
  export default Masonry;
}