import { NextRequest, NextResponse } from 'next/server'

const INDUSTRY_TEMPLATES = [
  {
    name: 'Home Services',
    templates: [
      { name: 'Before & After Showcase', platform: 'instagram', content: 'Check out this incredible transformation! [Before/After photos]\n\nOur team completed this [service] project in just [timeframe]. The homeowner was thrilled with the results.\n\nReady for your own transformation? Link in bio for a free estimate.\n\n#HomeImprovement #BeforeAndAfter #[YourCity]', type: 'promotional' },
      { name: 'Seasonal Maintenance Tips', platform: 'facebook', content: 'As [season] approaches, here are 5 things every homeowner should check:\n\n1. [Tip 1]\n2. [Tip 2]\n3. [Tip 3]\n4. [Tip 4]\n5. [Tip 5]\n\nWhich of these have you already done? Let us know in the comments!', type: 'educational' },
      { name: 'Customer Testimonial', platform: 'linkedin', content: 'Nothing beats hearing from a happy customer:\n\n"[Customer quote about your service]"\n\n- [Customer Name], [City]\n\nWe take pride in every project, big or small. Thank you for trusting us with your home.\n\n#CustomerReview #HomeServices', type: 'promotional' },
      { name: 'Day in the Life', platform: 'instagram', content: 'A day in the life of a [your trade] professional:\n\n6:00 AM - Load up the truck\n8:00 AM - Arrive at first job\n12:00 PM - Quick lunch break\n1:00 PM - Tackle the afternoon project\n5:00 PM - Clean up and head home\n\nIt is hard work, but we love what we do!', type: 'entertaining' },
    ],
  },
  {
    name: 'Real Estate',
    templates: [
      { name: 'New Listing Announcement', platform: 'instagram', content: 'Just Listed! [Address]\n\n[Bedrooms] bed | [Bathrooms] bath | [Sqft] sq ft\nListed at $[Price]\n\nHighlights:\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n\nDM me for a private showing or visit the link in my bio.\n\n#JustListed #RealEstate #[City]Homes', type: 'promotional' },
      { name: 'Market Update', platform: 'linkedin', content: '[Month] [City] Real Estate Market Update:\n\nMedian home price: $[Price] ([up/down] [%] from last month)\nDays on market: [Number]\nHomes sold: [Number]\nInventory: [Number] months\n\nWhat does this mean for buyers and sellers? [Brief analysis]\n\nThinking about making a move? Let us chat about your options.', type: 'educational' },
      { name: 'Home Buying Tips', platform: 'facebook', content: 'First-time homebuyer? Here are 3 things I wish every buyer knew before starting their search:\n\n1. Get pre-approved BEFORE you start looking at homes\n2. Your first offer probably will not be accepted - and that is okay\n3. The inspection is not optional - it protects your investment\n\nSave this post for later! What questions do you have about buying?', type: 'educational' },
    ],
  },
  {
    name: 'Restaurant',
    templates: [
      { name: 'Daily Special', platform: 'instagram', content: 'Today\'s Special: [Dish Name]\n\n[Brief description of the dish and what makes it special]\n\nAvailable today only while supplies last!\n\nReserve your table: [link/phone]\n\n#FoodSpecial #[RestaurantName] #[CuisineType]', type: 'promotional' },
      { name: 'Behind the Kitchen', platform: 'instagram', content: 'Ever wonder how we make our famous [dish]?\n\nHere is a peek behind the kitchen doors! Our chef [Name] has been perfecting this recipe for [years] years.\n\nThe secret? [Fun detail about preparation]\n\nCome taste the difference yourself!\n\n#BehindTheScenes #ChefLife', type: 'entertaining' },
      { name: 'Community Spotlight', platform: 'facebook', content: 'We are proud to partner with [Local Farm/Supplier] for our [ingredient].\n\nSupporting local means fresher ingredients on your plate and a stronger community for all of us.\n\nCome try our [dish featuring this ingredient] this week!\n\n#FarmToTable #SupportLocal #[YourCity]', type: 'educational' },
    ],
  },
  {
    name: 'E-commerce',
    templates: [
      { name: 'Product Launch', platform: 'instagram', content: 'Introducing: [Product Name]\n\n[One-line value proposition]\n\nWhat makes it special:\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n\nLaunch price: $[Price] (regular $[Higher Price])\n\nShop now - link in bio!\n\n#NewProduct #[BrandName] #[Category]', type: 'promotional' },
      { name: 'Customer UGC Repost', platform: 'instagram', content: 'We love seeing how you use [Product]!\n\nThanks to @[customer] for sharing this amazing photo.\n\nWant to be featured? Tag us in your photos using #[YourBrandHashtag]\n\n#CustomerLove #UGC', type: 'entertaining' },
      { name: 'How-To Guide', platform: 'facebook', content: 'How to get the most out of your [Product]:\n\nStep 1: [Action]\nStep 2: [Action]\nStep 3: [Action]\n\nPro tip: [Bonus advice]\n\nHave your own tips? Share them in the comments!', type: 'educational' },
      { name: 'Flash Sale', platform: 'twitter', content: 'FLASH SALE: [X]% off everything for the next [X] hours!\n\nUse code: [CODE] at checkout\n\nDon\'t miss out - this deal won\'t last!\n\n[Link]\n\n#Sale #[BrandName]', type: 'promotional' },
    ],
  },
  {
    name: 'Professional Services',
    templates: [
      { name: 'Industry Insight', platform: 'linkedin', content: 'I have been in [industry] for [X] years, and here is something most people get wrong about [topic]:\n\n[Contrarian or insightful take]\n\nHere is what I have learned works instead:\n\n1. [Point 1]\n2. [Point 2]\n3. [Point 3]\n\nWhat has been your experience? I would love to hear your perspective.\n\n#[Industry] #ProfessionalDevelopment', type: 'educational' },
      { name: 'Case Study Highlight', platform: 'linkedin', content: 'Client Success Story:\n\nChallenge: [Client was struggling with X]\nSolution: [We implemented Y approach]\nResult: [Z% improvement / $X saved / specific outcome]\n\nThe key takeaway? [One-line lesson]\n\nWant similar results for your business? Let us connect.\n\n#CaseStudy #Results', type: 'promotional' },
      { name: 'Quick Tip Tuesday', platform: 'twitter', content: 'Quick Tip Tuesday:\n\n[Actionable tip related to your expertise]\n\nThis alone can save you [time/money/hassle].\n\nBookmark this for later!\n\n#TipTuesday #[YourExpertise]', type: 'educational' },
    ],
  },
  {
    name: 'Health & Fitness',
    templates: [
      { name: 'Workout of the Day', platform: 'instagram', content: 'Today\'s Workout:\n\n[Exercise 1] - [Sets] x [Reps]\n[Exercise 2] - [Sets] x [Reps]\n[Exercise 3] - [Sets] x [Reps]\n[Exercise 4] - [Sets] x [Reps]\n\nRest 60 seconds between sets.\n\nTag your workout buddy!\n\n#WOD #FitnessMotivation #[GymName]', type: 'educational' },
      { name: 'Transformation Story', platform: 'facebook', content: 'Meet [Client Name]!\n\nWhen they first came to us, they were struggling with [challenge].\n\nAfter [X] weeks of consistent training and nutrition coaching:\n\n- [Result 1]\n- [Result 2]\n- [Result 3]\n\n"[Client testimonial quote]"\n\nReady to start your own journey? Link in bio for a free consultation.', type: 'promotional' },
      { name: 'Myth Buster', platform: 'twitter', content: 'Fitness Myth: "[Common misconception]"\n\nThe Truth: [Evidence-based correction]\n\nDon\'t let misinformation hold you back from your goals.\n\n#FitnessMyths #EvidenceBased #HealthTips', type: 'educational' },
      { name: 'Healthy Recipe Share', platform: 'instagram', content: 'Fuel your gains with this easy [meal type]:\n\n[Recipe Name]\n\nIngredients:\n- [Ingredient 1]\n- [Ingredient 2]\n- [Ingredient 3]\n\nMacros: [Calories] cal | [Protein]g protein | [Carbs]g carbs | [Fat]g fat\n\nSave this for meal prep day!\n\n#HealthyRecipe #MealPrep #FitFood', type: 'entertaining' },
    ],
  },
]

export async function GET(_request: NextRequest) {
  return NextResponse.json({ industries: INDUSTRY_TEMPLATES })
}
