"use client"


import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function WorkInProgress({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <h1 className="text-6xl font-bold">{name} è in fase di sviluppo 🚧</h1>
      <div className='size-[50%]'>
        <DotLottieReact
          src="https://lottie.host/72b13a0a-1a84-47f1-a495-a3bac8c0da86/mzn3LVamwg.lottie"
          loop
          autoplay
        />
      </div>
      <h3 className="text-2xl font-bold">Torna presto per scoprire le ultime novità!</h3>
    </div>
  )
}