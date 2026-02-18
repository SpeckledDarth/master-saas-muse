'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSettings } from '@/hooks/use-settings'

interface CustomerStory {
  id: string
  companyName: string
  companyLogoUrl?: string
  personName?: string
  personRole?: string
  personPhotoUrl?: string
  personPhotoPositionX?: number
  personPhotoPositionY?: number
  quote?: string
  storyUrl?: string
  backgroundImageUrl?: string
  backgroundPositionX?: number
  backgroundPositionY?: number
}

interface CustomerStoriesProps {
  stories?: CustomerStory[]
  headline?: string
  className?: string
}

function StoryCard({ story }: { story: CustomerStory }) {
  const content = (
    <div 
      className="group relative rounded-xl overflow-hidden h-80 transition-transform hover:scale-[1.02]"
      data-testid={`story-card-${story.id}`}
    >
      {story.backgroundImageUrl ? (
        <Image
          src={story.backgroundImageUrl}
          alt={story.companyName}
          fill
          className="object-cover"
          style={{ objectPosition: `${story.backgroundPositionX ?? 50}% ${story.backgroundPositionY ?? 50}%` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {story.companyLogoUrl && (
          <div className="mb-4">
            <img
              src={story.companyLogoUrl}
              alt={story.companyName}
              className="h-8 w-auto brightness-0 invert"
            />
          </div>
        )}
        {story.quote && (
          <p className="text-sm mb-4 line-clamp-3 opacity-90">"{story.quote}"</p>
        )}
        <div className="flex items-center gap-3">
          {story.personPhotoUrl && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
              <Image
                src={story.personPhotoUrl}
                alt={story.personName || ''}
                fill
                className="object-cover"
                style={{ objectPosition: `${story.personPhotoPositionX ?? 50}% ${story.personPhotoPositionY ?? 50}%` }}
              />
            </div>
          )}
          <div>
            {story.personName && (
              <p className="font-medium text-sm">{story.personName}</p>
            )}
            {story.personRole && (
              <p className="text-xs opacity-70">{story.personRole}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (story.storyUrl) {
    return (
      <Link href={story.storyUrl} className="block" data-testid={`link-story-${story.id}`}>
        {content}
      </Link>
    )
  }

  return content
}

export function CustomerStories({ stories, headline, className = '' }: CustomerStoriesProps) {
  const { settings } = useSettings()
  const storyList = stories || settings?.content?.customerStories || []
  const title = headline || settings?.content?.customerStoriesHeadline || 'Customer Stories'

  if (!storyList || storyList.length === 0) {
    return null
  }

  return (
    <section className={`py-16 md:py-24 ${className}`} data-testid="section-customer-stories">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {title}
        </h2>
        <div className={`grid gap-6 ${
          storyList.length === 1 ? 'max-w-lg mx-auto' :
          storyList.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
          storyList.length === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {storyList.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  )
}
