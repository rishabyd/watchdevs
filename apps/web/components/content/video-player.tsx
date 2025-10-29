import MuxPlayer from "@mux/mux-player-react";

export default function VideoPlayer({
  playbackId,
  title,
  userId,
}: {
  playbackId: string;
  title: string;
  userId: string;
}) {
  return (
    <div className="w-5xl mx-auto p-6">
      <div className="relative bg-black">
        <MuxPlayer
          playbackId={playbackId}
          metadata={{
            video_title: title,
            viewer_user_id: userId,
          }}
          streamType="on-demand"
          // Styling
          accentColor="#000000"
          primaryColor="#FFFFFF"
          // secondaryColor="#71717A"
          // Player controls
          autoPlay={true}
          muted={false}
          loop={false}
          // UI features
          thumbnailTime={0}
          preload="auto"
        />
      </div>
    </div>
  );
}
