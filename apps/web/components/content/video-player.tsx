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
    <div className="w-full bg-black">
      <div
        className="relative overflow-hidden bg-black"
        style={{ height: "67vh" }}
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
