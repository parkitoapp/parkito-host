import TitleHeader from "@/components/TitleHeader";
import GalleryClient from "@/components/GalleryClient";
export default function GalleryPage() {
  return (
    <div className="flex flex-col gap-2 min-h-calc[(100vh-68px)]">
      <TitleHeader title="Galleria" description="Galleria del tuo parcheggio" />
      <GalleryClient />
    </div>
  )
}