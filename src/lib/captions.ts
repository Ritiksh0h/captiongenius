export type Tone = {
  id: string
  label: string
  caption: string
  hashtags: string[]
}

// Tones used by the auto-cycling hero demo (single coffee photo).
export const HERO_TONES: Tone[] = [
  {
    id: "funny",
    label: "Funny",
    caption: "My personality is 90% caffeine and 10% pretending I read the menu.",
    hashtags: ["#ButFirstCoffee", "#CaffeineDependent", "#MondayFuel"],
  },
  {
    id: "emotional",
    label: "Emotional",
    caption: "Some mornings the quiet, the steam, and a good cup are all the therapy you need.",
    hashtags: ["#SlowMornings", "#LittleThings", "#Grateful"],
  },
  {
    id: "brand",
    label: "Brand",
    caption: "Crafted slow, sipped slower. This is what intentional mornings taste like.",
    hashtags: ["#CraftedDaily", "#MorningRitual", "#SipBySip"],
  },
  {
    id: "bold",
    label: "Bold",
    caption: "Wake up. Show up. Pour something worth posting about.",
    hashtags: ["#NoDaysOff", "#OwnTheMorning", "#FuelUp"],
  },
]

// Tones for the interactive "Watch it think" strip (dish photo).
export const EXPLORER_TONES: Tone[] = [
  {
    id: "funny",
    label: "Funny",
    caption: "I came for the vibes but I'm staying for the second helping.",
    hashtags: ["#TreatYourself", "#BrunchSquad", "#NoCrumbsLeft"],
  },
  {
    id: "storytelling",
    label: "Storytelling",
    caption:
      "It started as a lazy Sunday and somehow became the best plate I've had all year. Funny how the unplanned ones win.",
    hashtags: ["#SundayStory", "#FoodMoments", "#WorthIt"],
  },
  {
    id: "brand",
    label: "Brand",
    caption: "Every plate is a promise: fresh, local, and made to be remembered.",
    hashtags: ["#FarmToTable", "#MadeWithCare", "#TasteTheDifference"],
  },
  {
    id: "emotional",
    label: "Emotional",
    caption: "Good food has a way of slowing the whole world down for a minute. Cherish those minutes.",
    hashtags: ["#Mindful", "#PresentMoment", "#SimpleJoys"],
  },
  {
    id: "bold",
    label: "Bold",
    caption: "Plates this good don't need a caption. But here's one anyway.",
    hashtags: ["#FlavorFirst", "#GoBig", "#PlatedPerfection"],
  },
]

// ---- Generator configuration data ----

export type PlatformId =
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "facebook"
  | "pinterest"

export const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter/X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "pinterest", label: "Pinterest" },
]

export const CAPTION_STYLES: string[] = [
  "Witty",
  "Minimalist",
  "Storytelling",
  "Inspirational",
  "Bold",
  "Poetic",
  "Question",
  "Listicle",
  "Behind the scenes",
  "Hot take",
  "Nostalgic",
  "Educational",
  "Humble brag",
  "Call to action",
  "Quote",
  "Emoji-heavy",
  "Pun",
  "Confessional",
  "Aesthetic",
  "Hype",
  "Sarcastic",
  "Wholesome",
  "Mysterious",
  "Conversational",
  "Luxury",
  "Relatable",
  "Motivational",
  "Cinematic",
  "Cheeky",
  "Announcement",
  "Gratitude",
  "Throwback",
]

export const GEN_TONES: string[] = [
  "Playful",
  "Inspirational",
  "Witty",
  "Sophisticated",
  "Bold",
  "Romantic",
  "Adventurous",
]

export type LengthId = "snappy" | "standard" | "extended"

export const LENGTHS: { id: LengthId; label: string }[] = [
  { id: "snappy", label: "Snappy" },
  { id: "standard", label: "Standard" },
  { id: "extended", label: "Extended" },
]

export type GeneratedCaption = {
  text: string
  hashtags: string[]
  // optional fields added when parsing from API strings
  id?: string
  caption?: string
}

// Demo caption pool used to fabricate 5 results from the chosen options.
const CAPTION_POOL: GeneratedCaption[] = [
  {
    text: "Caught the kind of moment you can't plan for and wouldn't trade for anything.",
    hashtags: ["#NoFilterNeeded", "#RealMoments", "#CaughtInTheAct", "#Vibes", "#PicOfTheDay"],
  },
  {
    text: "Some days just photograph themselves. Today was loudly one of them.",
    hashtags: ["#GoldenHour", "#LiveTheMoment", "#Storytime", "#Memories", "#Daily"],
  },
  {
    text: "If a picture is worth a thousand words, consider this my whole novel.",
    hashtags: ["#Throwback", "#FeelingIt", "#Snapshot", "#OnRepeat", "#Mood"],
  },
  {
    text: "Pro tip: the best frames happen right before someone says \"wait, take another.\"",
    hashtags: ["#BehindTheScenes", "#Candid", "#JustBecause", "#Keepers", "#Authentic"],
  },
  {
    text: "Saving this one for the days I need a reminder that it's the small stuff that's the big stuff.",
    hashtags: ["#Grateful", "#LittleThings", "#PresentOverPerfect", "#Soft", "#Reminder"],
  },
  {
    text: "New post, same obsession. I regret nothing.",
    hashtags: ["#Obsessed", "#WorthIt", "#NoRegrets", "#AllIn", "#Hype"],
  },
  {
    text: "Documenting proof that good days are still very much a thing.",
    hashtags: ["#GoodDays", "#Proof", "#Joy", "#Everyday", "#Capture"],
  },
]

export function generateCaptions(seed = 0): GeneratedCaption[] {
  const out: GeneratedCaption[] = []
  for (let i = 0; i < 5; i++) {
    out.push(CAPTION_POOL[(seed + i) % CAPTION_POOL.length])
  }
  return out
}

export type RangeCard = {
  badge: string
  photo: string
  alt: string
  caption: string
  hashtags: string[]
  accent?: boolean
}

// Range showcase — same kinds of photos, wildly different output.
export const RANGE_CARDS: RangeCard[] = [
  {
    badge: "Español",
    photo: "/photo-travel.png",
    alt: "Woman in a yellow jacket on a coastal cliff at golden hour",
    caption: "El mundo es enorme y yo apenas estoy empezando a verlo. ¿A dónde vamos después?",
    hashtags: ["#Viajar", "#SinFronteras", "#HoraDorada"],
  },
  {
    badge: "Influencer",
    photo: "/photo-dog.png",
    alt: "Golden retriever running across a sunny park",
    caption: "POV: your best friend has zero followers and the biggest heart on the internet 🐾✨",
    hashtags: ["#DogsOfInsta", "#GoodBoy", "#PuppyLove", "#FYP"],
    accent: true,
  },
  {
    badge: "Storytelling",
    photo: "/photo-coffee.png",
    alt: "Latte in a ceramic cup on a wooden desk",
    caption:
      "Three years ago this was a side project and a lot of bad coffee. Today it's the thing I'm proudest of.",
    hashtags: ["#FoundersJourney", "#SmallWins"],
  },
  {
    badge: "Corporate",
    photo: "/photo-dish.png",
    alt: "Plated brunch dish with poached egg and microgreens",
    caption: "Excellence is a habit, not an event. Today's plate, sourced and prepared to our highest standard.",
    hashtags: ["#Hospitality", "#Quality", "#Brand"],
  },
]
