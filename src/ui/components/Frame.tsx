import type { ReactNode } from 'react';
import './Frame.css';

interface FrameProps {
  title?: string;
  children: ReactNode;
}

export function Frame({ title, children }: FrameProps) {
  return (
    <div className="apple2-frame">
      {title && <div className="apple2-frame-title">{title}</div>}
      <div className="apple2-frame-body">{children}</div>
    </div>
  );
}
