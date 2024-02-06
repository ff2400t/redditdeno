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

export async function submitImage(
  reddit: Reddit,
  data: SubmitPostOptions,
  image: SubmitFileInterface,
): Promise<any> {
  if (!image.mimeType.startsWith("image")) {
    throw "MimeType supplied is not an image";
  }
  const { link } = await uploadMedia(
    reddit,
    image.fileName,
    image.mimeType,
    image.blob,
  )
    .catch(() => {
      throw Error("Failed to upload image");
    });
  data.url = link;
  data.kind = "image";
  const res = await reddit.post(`/api/submit`, data);
  return await res.json();
}

export async function submitGallery(
  reddit: Reddit,
  data: SubmitGalleryOptoins,
  arr: SubmitFileInterface[],
): Promise<any> {
  if (!arr.every((a) => a.mimeType.startsWith("image"))) {
    throw "MimeType supplied is not an image";
  }
  const items = (await Promise.all(
    arr.map((item) =>
      uploadMedia(reddit, item.fileName, item.mimeType, item.blob)
    ),
  ).catch(() => {
    throw Error("Failed to upload image");
  })).map((a, i) => ({
    caption: arr[i].caption ?? "",
    outbound_url: arr[i].outbound_url ?? "",
    media_id: a.asset_id,
  }));

  data.items = items;

  const res = await reddit.jsonPostRequest(
    "/api/submit_gallery_post.json",
    data,
  );
  return await res.json();
}

export async function uploadMedia(
  reddit: Reddit,
  filename: string,
  mimetype: string,
  blob: Blob,
) {
  const uploadResponse = await reddit.post("/api/media/asset.json", {
    filepath: filename,
    mimetype,
  }).then((res) => res.json());
  const uploadURL = "https:" + uploadResponse.args.action;
  const formdata = new FormData();
  uploadResponse.args.fields.forEach((item: UploadMediaArgs) =>
    formdata.append(item.name, item.value)
  );
  formdata.append("file", blob, filename);
  const _response = await fetch(uploadURL, {
    method: "post",
    mode: "no-cors",
    body: formdata,
  });
  return {
    asset_id: uploadResponse.asset.asset_id,
    link: uploadURL + "/" +
      uploadResponse.args.fields.find((item: UploadMediaArgs) =>
        item.name === "key"
      ).value,
    websocket_url: uploadResponse.asset.websocket_url,
  };
}

interface UploadMediaArgs {
  name: string;
  value: string;
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

interface SubmitFileInterface {
  fileName: string;
  mimeType: string;
  blob: Blob;
  outbound_url?: string;
  caption?: string;
}

interface SubmitGalleryOptoins extends Omit<SubmitPostOptions, "kind"> {
  items?: {
    caption: string;
    outbound_url: string;
    media_id: string;
  }[];
}
