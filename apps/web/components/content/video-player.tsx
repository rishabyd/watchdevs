import MuxPlayer from "@mux/mux-player-react";

export default function VideoPlayer({ playbackId }: { playbackId: string }) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="relative bg-black">
        <MuxPlayer
          playbackId="EBdaEuEak00sP8sX6BnhlHFBU9S6I3xhdT01wmSTrUF4s"
          metadata={{
            video_title: "My Awesome Video",
            viewer_user_id: "user-123",
          }}
          streamType="on-demand"
          // Styling
          accentColor="#000000"
          primaryColor="#FFFFFF"
          secondaryColor="#71717A"
          // Player controls
          autoPlay={false}
          muted={false}
          loop={false}
          // UI features
          thumbnailTime={0}
          preload="auto"
        />
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">Video Title</h1>
        <p className="text-gray-600 mt-2">Video description goes here</p>
      </div>
    </div>
  );
}
