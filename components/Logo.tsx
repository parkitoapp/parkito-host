import Link from "next/link"
import Image from "next/image"

export default function Logo() {
    return (
        <Link
            href="https://parkito.app/"
            target="_blank"
            tabIndex={0}
            className="flex items-center gap-2 self-center font-medium"
        >
            {/* Light logo - visible in light mode, hidden in dark mode */}
            <Image
                src="/logo.webp"
                alt="Parkito"
                width={100}
                height={100}
                className="block dark:hidden"
            />
            {/* Dark logo - hidden in light mode, visible in dark mode */}
            <Image
                src="/logo-dark.webp"
                alt="Parkito"
                width={100}
                height={100}
                className="hidden dark:block"
            />
        </Link>
    )
}