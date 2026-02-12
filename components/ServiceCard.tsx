import { servicesType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import Image from 'next/image'
import Logo from './Logo'

export default function ServiceCard({ service }: { service: servicesType }) {



  return (
    <Card className='w-full max-w-5xl mx-auto flex flex-row items-center justify-center'>
      <CardHeader className='w-1/3'>
        <Image src={service.src} alt={service.title} width={150} height={150} className='rounded-md mx-auto' loading='lazy' objectFit='contain' />
      </CardHeader>
      <CardContent className='w-2/3 items-start justify-start flex flex-col gap-2'>
        <div className='flex flex-row items-center justify-center gap-6'>
          <Logo link={false} />
          {service.id === "allianz" && <span className='text-md font-bold text-muted-foreground'> X </span>}
          {service.id === "allianz" && <Image src={"/allianz.webp"} alt={service.title} width={150} height={150} className='rounded-md block dark:hidden' loading='lazy' objectFit='contain' />}
          {service.id === "allianz" && <Image src={"/allianz-white.webp"} alt={service.title} width={150} height={150} className='rounded-md hidden dark:block' loading='lazy' objectFit='contain' />}
        </div>
        <CardTitle className='text-2xl font-bold w-full'>{service.title}</CardTitle>
        <CardDescription className='text-md'>
          {service.description}
        </CardDescription>

      </CardContent>
    </Card>
  )
}