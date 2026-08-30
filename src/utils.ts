
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/;

export function isYoutubeUrl(url: string){
    return YOUTUBE_REGEX.test(url);
}

export const YT_DLP_FORMAT_FLAGS = [
    "-f", "bestvideo+bestaudio/best",
    "--merge-output-format", "mp4",
    // bun ships in the image already, so use it instead of pulling in deno
    "--js-runtimes", "bun",
];