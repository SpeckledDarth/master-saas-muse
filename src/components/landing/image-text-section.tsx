'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface ImageTextBlock {
  id: string
  headline: string
  description: string
  imageUrl: string
  imageAlt?: string
  buttonText?: string
  buttonLink?: string
  imagePosition: 'left' | 'right'
  imagePositionX?: number
  imagePositionY?: number
}

interface ImageTextSectionProps {
  blocks: ImageTextBlock[]
  className?: string
}

function SingleBlock({ block, index }: { block: ImageTextBlock; index: number }) {
  const isImageLeft = block.imagePosition === 'left'
  
  return (
    <div 
      className={`flex flex-col ${isImageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12 lg:gap-16`}
      data-testid={`image-text-block-${block.id}`}
    >
      <div className="w-full md:w-1/2">
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
          {block.imageUrl ? (
            <Image
              src={block.imageUrl}
              alt={block.imageAlt || block.headline}
              fill
              className="object-cover"
              style={{ objectPosition: `${block.imagePositionX ?? 50}% ${block.imagePositionY ?? 50}%` }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">Image placeholder</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-1/2 space-y-4">
        <h3 className="text-2xl md:text-3xl font-bold">
          {block.headline}
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {block.description}
        </p>
        {block.buttonText && block.buttonLink && (
          <Button asChild data-testid={`button-image-text-${block.id}`}>
            <Link href={block.buttonLink}>
              {block.buttonText}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function ImageTextSection({ blocks, className = '' }: ImageTextSectionProps) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <section className={`py-16 md:py-24 ${className}`} data-testid="section-image-text">
      <div className="container mx-auto px-4 space-y-16 md:space-y-24">
        {blocks.map((block, index) => (
          <SingleBlock key={block.id} block={block} index={index} />
        ))}
      </div>
    </section>
  )
}
