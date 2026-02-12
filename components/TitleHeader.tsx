import React from 'react'

type Props = {
  title: string
  description: string
}

export default function TitleHeader({ title, description }: Props) {
  return (
    <div className="space-y-1 mb-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}