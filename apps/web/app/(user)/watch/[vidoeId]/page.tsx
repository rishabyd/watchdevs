import VideoPlayer from "@/components/content/video-player";

type pageProps = {
  params: { videoId: string };
};

export default async function VideoPage({ params }: pageProps) {
  const videoId = params.videoId;

  return (
    <div className="flex flex-1 mt-9 flex-col">
      <VideoPlayer playbackId={videoId} />
    </div>
  );
}
