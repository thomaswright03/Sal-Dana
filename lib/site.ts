/**
 * Single source of truth for business details and marketing copy.
 * Edit here and the site, the structured data, and the AI assistant all update.
 */

export const site = {
  name: "Sal Dana Renovations",
  legalName: "Sal Dana Renovations LLC",
  owner: "Alan",
  tagline: "Handyman & renovation work, finished to a higher standard.",
  description:
    "Sal Dana Renovations LLC is Alan’s Arizona handyman and renovation practice. Repairs, installs, and home refreshes done carefully, by one craftsman, start to finish.",
  phone: "4804792342",
  phoneDisplay: "(480) 479-2342",
  phoneHref: "tel:+14804792342",
  smsHref: "sms:+14804792342",
  email: "saldanarenovations.llc@gmail.com",
  state: "Arizona",
  region: "Phoenix & the East Valley",
  // Assumed from the 480 area code. Confirm with Alan and edit freely.
  cities: ["Scottsdale", "Paradise Valley", "Tempe", "Mesa", "Chandler", "Gilbert", "Queen Creek", "Phoenix"],
  // Assumed working hours, used by the booking assistant. Day 0 = Sunday.
  workingDays: [1, 2, 3, 4, 5, 6],
  hoursDisplay: "Monday to Saturday, 8am to 5pm",
  timezone: "America/Phoenix",
} as const;

export const windows = [
  { id: "morning", label: "Morning", range: "8 to 11am" },
  { id: "midday", label: "Midday", range: "11am to 2pm" },
  { id: "afternoon", label: "Afternoon", range: "2 to 5pm" },
] as const;

export type WindowId = (typeof windows)[number]["id"];

export const services = [
  {
    id: "kitchens-baths",
    title: "Kitchen & bath refresh",
    blurb:
      "Cabinet hardware, faucets and fixtures, vanities, backsplashes, caulk and grout. The details that make a room feel new.",
    items: ["Fixtures & hardware", "Vanities & mirrors", "Backsplash", "Re-caulk & re-grout"],
  },
  {
    id: "carpentry",
    title: "Carpentry & trim",
    blurb: "Baseboards, crown, casing, shelving, and built-in details, scribed tight and finished clean.",
    items: ["Baseboard & crown", "Custom shelving", "Door casing", "Repairs & rot"],
  },
  {
    id: "drywall-paint",
    title: "Drywall & paint",
    blurb:
      "Patches you can’t find afterward. Texture matching, crisp lines, and rooms repainted without the mess.",
    items: ["Patch & repair", "Texture matching", "Interior painting", "Touch-ups"],
  },
  {
    id: "doors-windows",
    title: "Doors & hardware",
    blurb:
      "Doors that close with a quiet click. Hanging, adjusting, locksets, weatherstripping, and smart locks.",
    items: ["Door hanging", "Locks & smart locks", "Adjust & align", "Weatherstripping"],
  },
  {
    id: "tile-flooring",
    title: "Tile & flooring",
    blurb:
      "Tile repairs and small installs, transitions, and flooring fixes laid out with care so every line lands.",
    items: ["Tile repair", "Small installs", "Transitions", "Floor repairs"],
  },
  {
    id: "mounting-assembly",
    title: "Mounting & installs",
    blurb:
      "TVs, art, mirrors, shelving, window treatments, and furniture assembly. Level, anchored, and cable-clean.",
    items: ["TV & art mounting", "Shelving", "Blinds & curtains", "Assembly"],
  },
  {
    id: "outdoor",
    title: "Outdoor & patio",
    blurb: "Gates, fences, patio repairs, and exterior touch-ups built to hold up under the Arizona sun.",
    items: ["Gates & fences", "Patio repairs", "Exterior paint", "Sun & weather wear"],
  },
  {
    id: "punch-list",
    title: "The punch list",
    blurb: "That list on the fridge. Hand it over and get every item closed out in one visit, done properly.",
    items: ["Move-in / move-out", "Pre-sale prep", "Seasonal upkeep", "Odd jobs"],
  },
] as const;

export const processSteps = [
  {
    title: "Tell us about it",
    body: "Send a few details through the form, the assistant, or a call. Photos help. You’ll hear back from Alan directly.",
  },
  {
    title: "Walkthrough & estimate",
    body: "Alan looks at the work, talks through options, and gives you a clear estimate before anything begins.",
  },
  {
    title: "The work",
    body: "One craftsman, on site when he says he will be. Floors protected, the space kept tidy, the job done right.",
  },
  {
    title: "Final walkthrough",
    body: "You look over every detail together. The job is finished when you’re happy with it.",
  },
] as const;

export const principles = [
  {
    title: "One craftsman",
    body: "The person you talk to is the person who does the work. No handoffs, no subcontracted surprises.",
  },
  {
    title: "Clear estimates",
    body: "You know the scope and the price before work begins. If something changes, you hear about it first.",
  },
  {
    title: "A clean site",
    body: "Surfaces covered, dust controlled, everything swept. Your home is left better than it was found.",
  },
  {
    title: "Finished properly",
    body: "Tight joints, straight lines, hardware that lines up. The small things are the whole point.",
  },
] as const;

export const faqs = [
  {
    q: "How do I book a visit?",
    a: "Use the booking form, chat with the assistant in the corner, or call or text (480) 479-2342. Pick a day and time window that suits you and Alan will confirm it personally.",
  },
  {
    q: "What kind of jobs do you take on?",
    a: "Everything from a single repair to a full punch list or a room refresh: carpentry, drywall and paint, doors and hardware, tile, mounting and installs, and outdoor repairs. If you’re not sure it fits, ask.",
  },
  {
    q: "How do estimates work?",
    a: "Tell us what you need and share photos if you can. For most work Alan will take a look in person, then give you a clear estimate before anything starts.",
  },
  {
    q: "Where do you work?",
    a: "Across Phoenix and the East Valley, including Scottsdale, Paradise Valley, Tempe, Mesa, Chandler, and Gilbert. Outside that area, get in touch and we’ll see what’s possible.",
  },
  {
    q: "Who runs Sal Dana Renovations?",
    a: "Sal Dana Renovations LLC is an Arizona handyman and renovation business run by Alan. For questions about licensing or insurance, ask Alan directly and he will answer.",
  },
] as const;
