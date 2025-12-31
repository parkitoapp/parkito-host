"use client"

import { cn } from "@/lib/utils"

const iconDataSets = {
    set1: [
        { emoji: '🚗', color: '#3B5FB3' },  // primary blue (identity)
        { emoji: '🅿️', color: '#2B4FA0' },  // darker blue
        { emoji: '🏠', color: '#00C853' },  // secondary green
        { emoji: '🔑', color: '#4A7BC3' },  // medium blue
        { emoji: '📍', color: '#5A9FD4' },  // light cyan-blue
    ],
    set2: [
        { emoji: '🚙', color: '#1E3A8A' },  // deep blue (identity)
        { emoji: '🚘', color: '#3F51B5' },  // indigo-blue
        { emoji: '🏢', color: '#60A5FA' },  // bright blue
        { emoji: '⏱️', color: '#00BFA5' },  // teal
        { emoji: '💳', color: '#009640' },  // darker green
    ],
    set3: [
        { emoji: '🛞', color: '#2563EB' },  // vibrant blue
        { emoji: '🚦', color: '#4C1D95' },  // deep blue-purple
        { emoji: '🗺️', color: '#059669' },  // emerald green
        { emoji: '⚡', color: '#0369A1' },  // sky blue
        { emoji: '🏁', color: '#37B7C3' },  // cyan-teal
    ],
}

interface SmoothInfiniteScrollProps {
    scrollDirection?: 'up' | 'down'
    iconSet?: 'set1' | 'set2' | 'set3'
    className?: string
}

export function SmoothInfiniteScroll({
    scrollDirection = 'down',
    iconSet = 'set1',
    className,
}: SmoothInfiniteScrollProps) {
    const iconData = iconDataSets[iconSet]
    // Quadruple the items for seamless infinite loop
    const items = [...iconData, ...iconData, ...iconData, ...iconData]

    return (
        <div
            className={cn(
                "overflow-hidden relative w-full h-screen",
                className
            )}
        >
            <div
                className={cn(
                    "flex flex-col gap-2.5 py-5 w-full items-center",
                    scrollDirection === 'down' ? 'animate-scroll-down' : 'animate-scroll-up'
                )}
            >
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="w-full aspect-square flex items-center justify-center rounded-[20px] shadow-[0px_-2px_10px_rgba(0,0,0,0.1)] shrink-0"
                        style={{ backgroundColor: item.color }}
                    >
                        <span className="text-9xl">{item.emoji}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

