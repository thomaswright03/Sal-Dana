/**
 * Preview mode. When NEXT_PUBLIC_DEMO_MODE is "1" the site shows the sample
 * reviews below (labelled as samples) and asks search engines not to index it.
 * Turn it off, and replace the samples with real reviews, before launch.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export interface Review {
  name: string;
  city: string;
  service: string;
  when: string;
  text: string;
}

/** Placeholder reviews for previewing the layout. None of these are real customers. */
export const sampleReviews: Review[] = [
  {
    name: "Karen M.",
    city: "Scottsdale",
    service: "Doors & hardware",
    when: "2 weeks ago",
    text: "Three doors in our house never closed right. Alan had all of them hung true in an afternoon and they shut with a click now. Tidy, on time, and a pleasure to have around.",
  },
  {
    name: "David R.",
    city: "Gilbert",
    service: "The punch list",
    when: "3 weeks ago",
    text: "Handed over a list of fourteen things we’d been putting off for two years. Every one of them done in a single visit, and done better than I would have asked for.",
  },
  {
    name: "Priya S.",
    city: "Tempe",
    service: "Drywall & paint",
    when: "1 month ago",
    text: "I honestly cannot find where the hole in the hallway was. The texture match is perfect. He covered the floors, cleaned up everything, and left the place spotless.",
  },
  {
    name: "Michael T.",
    city: "Paradise Valley",
    service: "Carpentry & trim",
    when: "1 month ago",
    text: "The crown molding in our dining room looks like it was always there. Tight corners, clean caulk lines, not a nail hole in sight. Real craftsmanship.",
  },
  {
    name: "Jessica L.",
    city: "Chandler",
    service: "Kitchen & bath refresh",
    when: "2 months ago",
    text: "New faucet, new hardware on every cabinet, and a fresh backsplash. The kitchen feels brand new and it took two days. Clear estimate up front and no surprises.",
  },
  {
    name: "Robert H.",
    city: "Mesa",
    service: "Outdoor & patio",
    when: "2 months ago",
    text: "Our side gate had been dragging for years. Alan rebuilt it properly, and it swings with one finger now. He even touched up the paint on the posts without being asked.",
  },
  {
    name: "Angela W.",
    city: "Scottsdale",
    service: "Mounting & installs",
    when: "2 months ago",
    text: "Mounted an 85 inch TV over the fireplace with every cable hidden. Dead level. He also hung a gallery wall while he was here and laid it all out with me first.",
  },
  {
    name: "Tom B.",
    city: "Queen Creek",
    service: "Tile & flooring",
    when: "3 months ago",
    text: "Replaced six cracked tiles in the entry and you cannot tell which ones are new. Showed up exactly when he said he would. That alone is rare.",
  },
  {
    name: "Sofia G.",
    city: "Phoenix",
    service: "The punch list",
    when: "3 months ago",
    text: "We were getting our house ready to sell and Alan worked through the whole inspection list in two days. Our agent asked for his number before she left.",
  },
  {
    name: "Daniel K.",
    city: "Gilbert",
    service: "Carpentry & trim",
    when: "4 months ago",
    text: "Built-in shelves in the office, scribed to a wall that is nowhere near straight. They look custom because they are. Fair price, careful work, great communication.",
  },
];
