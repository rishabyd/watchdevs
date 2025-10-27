"use client";

import useSWR from "swr";

import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TrendingDown, TrendingUp } from "@workspace/ui/icons";

type Totals = {
  allTimeUsageCredits: number;
  monthUsageCredits: number;
  requestsLast30: number;
  successRateLast30: number;
  activeKeys: number;
};

export function SectionCards({ totals: totalsProp }: { totals?: Totals }) {
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data } = useSWR(
    totalsProp ? null : "/api/dashboard/metrics",
    fetcher
  );
  const totals: Totals | undefined = totalsProp ?? data?.totals;
  const allTime = totals?.allTimeUsageCredits ?? 0;
  const monthUsage = totals?.monthUsageCredits ?? 0;
  const successRate = totals?.successRateLast30 ?? 0;
  const activeKeys = totals?.activeKeys ?? 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Credits Used</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {allTime.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Requests (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totals?.requestsLast30 ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {successRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Keys</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeKeys}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
