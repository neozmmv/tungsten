/*  const proc = Bun.spawn({
      cmd: [
        "yt-dlp",
        "-f",
        "bestvideo+bestaudio/best",
        "--merge-output-format", "mp4",
        "-o", "%(uploader)s - %(title)s.%(ext)s",
        "--print", "after_move:filepath",
        body.url
      ],
      stdout: "pipe"
    });

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if(exitCode != 0) {
        return c.json({"error": "yt-dlp failed to download the video"}, 500)
    }
    return c.json({"downloaded": true}) */