import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import Image from "next/image";

export default async function VideoCard({
  thumbnailUrl,
  creatorId,
  playbackI,
  id,
}) {
  return (
    <Card className="rounded-none w-md bg-accent border-green-500">
      {/*<Image src={} />*/}
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
        <CardAction>Card Action</CardAction>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
