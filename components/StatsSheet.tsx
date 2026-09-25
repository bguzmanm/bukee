"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: string;
  tags: Record<string, number>;
  authors: Record<string, number>;
}

const MAX_BARS = 15;

function toData(counts: Record<string, number>) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_BARS)
    .map(([name, count]) => ({ name, count }));
}

function Chart({
  data,
  fill,
  axisWidth,
}: {
  data: { name: string; count: number }[];
  fill: string;
  axisWidth: number;
}) {
  const height = Math.max(120, data.length * 32);
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[380px]">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={axisWidth}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(value) => [
                `${value} ${value === 1 ? "título" : "títulos"}`,
                "Cantidad",
              ]}
            />
            <Bar
              dataKey="count"
              fill={fill}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatsSheet({
  open,
  onOpenChange,
  view,
  tags,
  authors,
}: StatsSheetProps) {
  const tagData = toData(tags);
  const authorData = toData(authors);
  const tagTruncated = Object.keys(tags).length > MAX_BARS;
  const authorTruncated = Object.keys(authors).length > MAX_BARS;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <SheetTitle>Estadísticas · {view}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-8">
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Títulos por etiqueta
            </h3>
            {tagData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin etiquetas en esta vista.
              </p>
            ) : (
              <>
                <Chart data={tagData} fill="var(--primary)" axisWidth={150} />
                {tagTruncated && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Mostrando las {MAX_BARS} etiquetas con más títulos.
                  </p>
                )}
              </>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2">
              Títulos por autor
            </h3>
            {authorData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin autores en esta vista.
              </p>
            ) : (
              <>
                <Chart data={authorData} fill="var(--chart-4)" axisWidth={160} />
                {authorTruncated && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Mostrando los {MAX_BARS} autores con más títulos.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}