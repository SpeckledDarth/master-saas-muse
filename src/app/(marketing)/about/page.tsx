'use client'

import { useSettings } from '@/hooks/use-settings'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Users, Target, Heart } from 'lucide-react'
import { PageHero } from '@/components/page-hero'

export default function AboutPage() {
  const { settings, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-about" />
      </div>
    )
  }

  const about = settings?.pages?.about
  const branding = settings?.branding

  return (
    <div className="flex flex-col">
      <PageHero
        headline={about?.headline || 'About Us'}
        subheadline={about?.subheadline || 'Learn more about our mission and team'}
        imageUrl={about?.heroImageUrl}
        positionX={about?.heroImagePositionX ?? 50}
        positionY={about?.heroImagePositionY ?? 50}
        testId="about"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
        <section>
          <Card>
            <CardContent className="p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2" data-testid="text-our-story">
                <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                Our Story
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-about-story">
                {about?.story || 'We started with a simple idea: make powerful tools accessible to everyone.'}
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardContent className="p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2" data-testid="text-our-mission">
                <Target className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-about-mission">
                {about?.mission || 'Our mission is to empower businesses and individuals with intuitive, powerful software.'}
              </p>
            </CardContent>
          </Card>
        </section>

        {about?.values && about.values.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-center" data-testid="text-our-values">
              Our Values
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {about.values.map((value, index) => (
                <Card key={index} className="text-center hover-elevate">
                  <CardContent className="p-6">
                    <p className="font-medium" data-testid={`text-value-${index}`}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {about?.showTeam && about.team && about.team.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-center" data-testid="text-team-headline">
              {about.teamHeadline || 'Meet Our Team'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {about.team.map((member) => (
                <Card key={member.id} className="text-center hover-elevate">
                  <CardContent className="p-6">
                    {member.imageUrl ? (
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        data-testid={`img-team-${member.id}`}
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center"
                        data-testid={`img-team-placeholder-${member.id}`}
                      >
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold" data-testid={`text-team-name-${member.id}`}>
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-team-role-${member.id}`}>
                      {member.role}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-team-bio-${member.id}`}>
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="text-center">
          <Card>
            <CardContent className="p-4 md:p-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-contact-cta">
                Want to learn more?
              </h2>
              <p className="text-muted-foreground mb-4">
                Get in touch with our team at{' '}
                <a 
                  href={`mailto:${branding?.supportEmail || 'support@example.com'}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                  data-testid="link-contact-email"
                >
                  {branding?.supportEmail || 'support@example.com'}
                </a>
              </p>
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </div>
  )
}
