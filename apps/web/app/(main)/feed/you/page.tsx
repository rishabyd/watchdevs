"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Plus } from "@workspace/ui/icons";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WalletPage() {
  const { data, isLoading, error } = useSWR("/api/wallet", fetcher);

  const topups = data?.topups || [];

  return (
    <div className="mt-8 px-10 lg:px-14 space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Billing & Credits
          </h1>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      {/* Transactions */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">
            Top‑up transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">
              Failed to load transactions.
            </div>
          ) : topups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-md border">
              <div className="max-h-[520px] overflow-auto">
                <Table className="[&_th]:bg-muted/40 sticky-header">
                  <TableHeader className="sticky top-0 z-10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance after transaction</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topups.map((t: any, i: number) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium">Credit added</p>
                              <p className="text-xs text-muted-foreground">
                                {t.gatewayTransactionId
                                  ? `TX: ${t.gatewayTransactionId}`
                                  : "Manual"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <div>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              +{Number(t.amountCredits).toLocaleString()}{" "}
                              credits
                            </span>
                            {t.paymentAmountUsd && (
                              <p className="text-xs text-muted-foreground">
                                ${Number(t.paymentAmountUsd).toFixed(2)} USD
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {Number(t.runningBalanceCredits).toLocaleString()}{" "}
                          credits
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(t.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 rounded-full bg-muted w-12 h-12 grid place-items-center">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        No top‑ups yet. Add credits to get started.
      </p>
      <div className="mt-4">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add credits
        </Button>
      </div>
    </div>
  );
}
