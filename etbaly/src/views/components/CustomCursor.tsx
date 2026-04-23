import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update position instantly - CSS transition will handle smoothness
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.classList.contains('cursor-hover') ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.closest('.cursor-hover') !== null;
      
      setIsHovering(isInteractive);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver);

    // Hide default cursor
    document.body.style.cursor = 'none';
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      
      // Restore default cursor
      document.body.style.cursor = '';
      style.remove();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[10000]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      <div
        className={`rounded-full border-2 transition-all duration-200 ${
          isHovering 
            ? 'w-[60px] h-[60px] bg-primary/20 border-primary' 
            : 'w-[40px] h-[40px] bg-transparent border-primary'
        }`}
        style={{
          transition: 'width 0.2s ease-out, height 0.2s ease-out, background-color 0.2s ease-out',
        }}
      />
    </div>
  );
}
