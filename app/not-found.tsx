'use client'
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(m => m.DotLottieReact),
  { ssr: false }
);

export default function notFound() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col md:flex-row items-center justify-center">
      <div>
        <DotLottieReact
          src="https://lottie.host/0f42691d-3e37-4fd2-ba6b-a2e53039d053/Wu7plc2j1N.lottie"
          loop
          autoplay
        />
      </div>
      <div className="flex flex-col gap-2 justify-center md:justify-start">
        <h1 className="text-7xl font-bold mb-4 text-primary text-center md:text-left">404</h1>
        <p className="text-2xl text-primary font-semibold text-center md:text-left">Oops!</p>
        <p className="text-2xl text-primary font-semibold mb-6 text-center md:text-left">La pagina che stavi cercando non esiste:(</p>
        <Button variant="default" className="mx-auto md:mx-0 p-6 rounded-lg" asChild>
          <Link href="/">Torna alla Home</Link>
        </Button>
      </div>
    </div >
  )
}