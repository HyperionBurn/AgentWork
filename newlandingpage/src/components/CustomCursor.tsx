import { useEffect, useState } from "react";
import { motion } from "motion/react";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  // Hide cursor on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 z-[100] pointer-events-none mix-blend-difference hidden md:block"
      animate={{
        x: mousePosition.x - (isHovering ? 24 : 8),
        y: mousePosition.y - (isHovering ? 24 : 8),
        scale: isHovering ? 1 : 1,
      }}
      transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
    >
      <motion.div 
        className="rounded-full bg-orange-500 flex items-center justify-center"
        animate={{
            width: isHovering ? 48 : 16,
            height: isHovering ? 48 : 16,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isHovering && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-1.5 h-1.5 bg-black rounded-full"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
