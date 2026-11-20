/**
 * Preview mode. When NEXT_PUBLIC_DEMO_MODE is "1" the site asks search engines
 * not to index it, because it is carrying sample content. Turn it off at launch.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
