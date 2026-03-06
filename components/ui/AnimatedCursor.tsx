"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function AnimatedCursor() {
    const cursorDotOutline = useRef<HTMLDivElement>(null);
    const cursorDot = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);
    const pathname = usePathname();

    // We keep state only for click and hover interactions to toggle CSS classes, 
    // NOT for coordinate tracking, which was causing the severe lag.
    const [isClicking, setIsClicking] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Use refs for positions to avoid React re-renders on mousemove
    const mousePos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
    const dotPos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
    const outlinePos = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });

    useEffect(() => {
        // Only mount interaction listeners, position tracking is separate
        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const attachHoverListeners = () => {
            const interactables = document.querySelectorAll(
                "a, button, input, textarea, select, [role='button'], .hover-target"
            );

            interactables.forEach((el) => {
                el.addEventListener("mouseenter", () => setIsHovered(true));
                el.addEventListener("mouseleave", () => setIsHovered(false));
            });

            return () => {
                interactables.forEach((el) => {
                    el.removeEventListener("mouseenter", () => setIsHovered(true));
                    el.removeEventListener("mouseleave", () => setIsHovered(false));
                });
            };
        };

        // Delay attaching to ensure DOM elements exist
        const timeout = setTimeout(attachHoverListeners, 500);
        return () => clearTimeout(timeout);
    }, [pathname]); // Re-attach listeners when path changes

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
        };

        window.addEventListener("mousemove", handleMouseMove);

        // High performance animation loop using requestAnimationFrame
        const animate = () => {
            // Small dot follows mouse immediately
            dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.9;
            dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.9;

            // Outline dot follows with slight delay (spring physics)
            outlinePos.current.x += (mousePos.current.x - outlinePos.current.x) * 0.25;
            outlinePos.current.y += (mousePos.current.y - outlinePos.current.y) * 0.25;

            if (cursorDot.current && cursorDotOutline.current) {
                // Use translate3d to force hardware acceleration and skip React state updates
                cursorDot.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0)`;
                cursorDotOutline.current.style.transform = `translate3d(${outlinePos.current.x}px, ${outlinePos.current.y}px, 0)`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        // Start the loop
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Hide custom cursor on small touch devices
    if (typeof window !== "undefined" && window.innerWidth < 768) {
        return null;
    }

    // Define dynamic classes based on cheap boolean states
    const dotClasses = `fixed pointer-events-none z-[99999] rounded-full w-2 h-2 bg-primary mix-blend-screen transition-opacity duration-150 transform -translate-x-1/2 -translate-y-1/2 ${isHovered || isClicking ? "opacity-0" : "opacity-100"
        }`;

    const outlineClasses = `fixed pointer-events-none z-[99998] rounded-full border border-primary/60 bg-primary/10 backdrop-blur-[1px] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out will-change-transform ${isClicking
            ? "w-8 h-8 opacity-40"
            : isHovered
                ? "w-16 h-16 opacity-30 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-primary/5"
                : "w-8 h-8 opacity-100"
        }`;

    return (
        <>
            <div
                ref={cursorDotOutline}
                className={outlineClasses}
                style={{ left: 0, top: 0 }}
            />
            <div
                ref={cursorDot}
                className={dotClasses}
                style={{ left: 0, top: 0 }}
            />
        </>
    );
}
