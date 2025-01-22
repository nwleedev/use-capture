export class YoutubeLibs {
  static VIDEO_ID = "v";
  static getVideoId(url: string) {
    const searchParams = new URL(url).searchParams;
    return searchParams.get(YoutubeLibs.VIDEO_ID);
  }
}
