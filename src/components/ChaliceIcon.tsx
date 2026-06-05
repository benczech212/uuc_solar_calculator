import React from 'react';

export function ChaliceIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4"/>
      <circle cx="48" cy="52" r="48" fill="none" stroke="currentColor" strokeWidth="2"/>
      
      {/* Flame */}
      <path d="M 64 35 C 64 50 56 48 56 50 C 56 46 58 40 58 35 C 55 20 62 10 62 10 C 62 10 68 20 64 35 Z" />
      
      {/* Bowl */}
      <path d="M 30 52 C 40 54 60 54 70 52 C 75 51 86 51 86 51 C 86 51 60 60 50 60 C 40 60 14 51 14 51 C 14 51 25 51 30 52 Z" />
      
      {/* Stem */}
      <path d="M 48 60 L 48 92 C 48 92 40 94 40 94 C 40 94 60 94 60 94 C 60 94 52 92 52 92 L 52 60 Z" />
    </svg>
  );
}
