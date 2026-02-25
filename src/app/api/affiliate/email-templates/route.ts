import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [linkRes, profileRes] = await Promise.all([
      supabase.from('referral_links').select('code, referral_url').eq('user_id', user.id).single(),
      supabase.from('affiliate_profiles').select('display_name').eq('user_id', user.id).single()
    ]);

    const code = linkRes.data?.code || 'PARTNER';
    const url = linkRes.data?.referral_url || 'https://passivepost.com';
    const name = profileRes.data?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Your Name';

    const templates = [
      {
        id: 'intro-cold',
        name: 'Cold Introduction',
        subject: 'Quick tool recommendation for your content workflow',
        body: `Hi {{recipient_name}},\n\nI've been using PassivePost to schedule all my content across platforms and it's saved me a ton of time.\n\nIf you're still manually posting to each platform, you might want to check it out. I have a partner code (${code}) that gets you a discount.\n\nHere's my link: ${url}\n\nHappy to answer any questions about how I use it.\n\nBest,\n${name}`
      },
      {
        id: 'follow-up',
        name: 'Follow-Up (After Interest)',
        subject: 'Re: PassivePost — here\'s what I love about it',
        body: `Hi {{recipient_name}},\n\nThanks for your interest! Here are the top 3 things I love about PassivePost:\n\n1. **Cross-platform scheduling** — One post, all platforms, scheduled in advance\n2. **AI content suggestions** — It helps me write better captions and posts\n3. **Analytics** — I can see which content performs best across all channels\n\nUse my code ${code} for a discount: ${url}\n\nLet me know if you have any questions!\n\n${name}`
      },
      {
        id: 'testimonial',
        name: 'Personal Testimonial',
        subject: 'How I saved 10+ hours per week on content',
        body: `Hi {{recipient_name}},\n\nI used to spend hours every week manually posting content to different platforms. Since switching to PassivePost, I schedule everything in one sitting and it goes out automatically.\n\nThe results speak for themselves — my engagement is up and I've reclaimed my mornings.\n\nIf you want to try it, here's my partner link with a discount: ${url}\nCode: ${code}\n\nBest,\n${name}`
      },
      {
        id: 'agency-pitch',
        name: 'Agency/Team Pitch',
        subject: 'Content scheduling solution for your team',
        body: `Hi {{recipient_name}},\n\nI noticed your team publishes a lot of content across multiple channels. I wanted to recommend PassivePost — it's what I use to manage all my content scheduling.\n\nFor teams, the key benefits are:\n- Centralized content calendar\n- Role-based access for team members\n- Unified analytics across all platforms\n- AI-powered content suggestions\n\nI have a partner code (${code}) that gets your team a discount: ${url}\n\nWould love to chat more about how it could help your workflow.\n\n${name}`
      },
      {
        id: 'newsletter-mention',
        name: 'Newsletter Mention',
        subject: 'Tool of the week: PassivePost',
        body: `📌 **Tool Spotlight: PassivePost**\n\nThis week I want to share the tool that's transformed my content workflow. PassivePost lets me schedule posts across all my platforms from one dashboard.\n\n**What I love:**\n✅ Schedule once, publish everywhere\n✅ AI-powered caption writing\n✅ Analytics that actually make sense\n✅ Saves me 10+ hours per week\n\n👉 Try it with my partner code ${code}: ${url}\n\n— ${name}`
      }
    ];

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
