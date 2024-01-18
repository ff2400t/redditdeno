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

export async function submitPost(
  reddit: Reddit,
  data: SubmitPostOptions,
): Promise<any> {
  const res = await reddit.post(`/api/submit`, data);
  return await res.json();
}

interface SubmitPostOptions {
  title: string;
  sr: string; // name of the subreddit without the "r/" Prefix
  text?: string; // raw markdown text
  flair_id?: string;
  flair_text?: string;
  nsfw?: boolean;
  resubmit?: boolean;
  send_replies?: boolean;
  spoiler?: boolean;
  url?: string; // we will use this for the image URL that we get from
  kind: "link" | "self" | "image" | "video" | "videogif";
}
