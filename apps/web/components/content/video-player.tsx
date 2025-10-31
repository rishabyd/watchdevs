"use client";

export default function VideoPlayer({
  bunnyVideoId,
  bunnyLibraryId,
  title,
  userId,
}: {
  bunnyVideoId: string;
  bunnyLibraryId: string;
  title: string;
  userId: string;
}) {
  const embedUrl = `https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}`;

  return (
    <div className="w-5xl mx-auto p-6">
      <div
        className="relative bg-background  overflow-hidden"
        style={{ aspectRatio: "16 / 9" }}
      >
        <iframe
          id="bunny-stream-player"
          src={embedUrl}
          loading="lazy"
          style={{
            border: "none",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          title={title}
        />
      </div>
    </div>
  );
}
