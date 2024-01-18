// deno-lint-ignore-file no-explicit-any
import Reddit from "./mod.ts";

export async function subredditLinkFlairs(
  reddit: Reddit,
  subreddit: string,
): Promise<any> {
  const res = await reddit.get(`r/${subreddit}/api/link_flair`);
  return await res.json();
}

export async function subredditAbout(
  reddit: Reddit,
  subreddit: string,
): Promise<any> {
  const res = await reddit.get(`r/${subreddit}/about`);
  return await res.json();
}

export async function subredditPostRequirements(
  reddit: Reddit,
  subreddit: string,
): Promise<any> {
  const res = await reddit.get(`/api/v1/${subreddit}/post_requirements`);
  return await res.json();
}
