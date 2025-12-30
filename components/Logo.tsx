"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"


export default function Logo() {
    const theme = useTheme()
    return (
        <Link
            href="https://parkito.app/"
            target="_blank"
            tabIndex={0}
            className="flex items-center gap-2 self-center font-medium"
        >
            <Image src={theme.theme === "dark" ? "/logo-dark.webp" : "/logo.webp"} alt="Parkito" width={100} height={100} />
        </Link>
    )
}