/**
 * ThemeSwitch component to toggle between light and dark themes.
 * Utilizes next-themes for theme management, shadcn Switch component, and lucide-react for icons.
 * Features smooth animations when switching between themes with icons inside the switch.
 * 
 * @returns {JSX.Element} The ThemeSwitch component.
 */

"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function ThemeSwitch() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // When mounted on client, now we can show the UI
    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(id);
    }, []);

    if (!mounted) return null;

    const isLightMode = theme === "light";

    return (
        <SwitchPrimitive.Root
            checked={!isLightMode}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            className={cn(
                "peer inline-flex h-8 w-16 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors duration-400 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                isLightMode ? "bg-amber-300" : "bg-blue-900"
            )}
            aria-label="Toggle Theme"
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    "pointer-events-none flex items-center justify-center h-7 w-7 rounded-full bg-white shadow-lg ring-0 transition-transform duration-400 ease-in-out",
                    "data-[state=checked]:translate-x-8 data-[state=unchecked]:translate-x-0.5"
                )}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isLightMode ? (
                        <motion.div
                            key="sun"
                            initial={{ rotate: -180, opacity: 0, scale: 0.6 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 180, opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                            <Sun className="h-4 w-4 text-amber-500" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ rotate: 180, opacity: 0, scale: 0.6 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: -180, opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                            <Moon className="h-4 w-4 text-blue-600" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
    )
}