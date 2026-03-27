"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Banknote, Sparkles, CheckCircle, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalSpent: number;
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  todayRevenue: number;
  todayTasks: number;
  dailyStats: Array<{
    date: string;
    revenue: number;
    spent: number;
    transactions: number;
  }>;
  popularModels: Array<{ model: string; count: number }>;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    startTime.current = null;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

function CountUpNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animatedValue = useCountUp(value);
  return (
    <>
      {animatedValue.toLocaleString()}
      {suffix}
    </>
  );
}

const MODEL_COLORS = ["#D63384", "#C8A951", "#6C5CE7", "#E84393", "#B5246B"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const customTooltipStyle = useCallback(() => ({
    backgroundColor: "rgba(255, 248, 240, 0.95)",
    border: "1px solid rgba(214, 51, 132, 0.2)",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    padding: "8px 12px",
    fontSize: "13px",
  }), []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading stats...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const successRate =
    stats.totalTasks > 0
      ? Math.round((stats.successTasks / stats.totalTasks) * 1000) / 10
      : 0;

  const statCards = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: stats.totalUsers,
      suffix: "",
      icon: Users,
      gradient: "from-[#D63384] to-[#E84393]",
      iconBg: "bg-chaba-pink/10",
      iconColor: "text-chaba-pink",
    },
    {
      title: "รายได้",
      value: stats.totalRevenue,
      suffix: " THB",
      icon: Banknote,
      gradient: "from-chaba-gold to-chaba-gold-light",
      iconBg: "bg-chaba-gold/10",
      iconColor: "text-chaba-gold",
    },
    {
      title: "การสร้างทั้งหมด",
      value: stats.totalTasks,
      suffix: "",
      icon: Sparkles,
      gradient: "from-chaba-purple to-[#A29BFE]",
      iconBg: "bg-chaba-purple/10",
      iconColor: "text-chaba-purple",
    },
    {
      title: "อัตราสำเร็จ",
      value: successRate,
      suffix: "%",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-400",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมระบบ Chaba AI
        </p>
      </div>

      {/* Stat Cards with staggered animation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={cn("glass-card card-enter relative overflow-hidden")}
          >
            {/* Gradient top border */}
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`}
            />
            <CardContent className="flex items-center gap-4 px-4 py-5">
              <div className={`rounded-xl p-3 ${card.iconBg} transition-transform hover:scale-110`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{card.title}</p>
                <p className="text-2xl font-bold tracking-tight">
                  <CountUpNumber value={card.value} suffix={card.suffix} />
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue AreaChart */}
        <Card className="glass-card card-enter" style={{ animationDelay: "0.25s" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chaba-pink" />
              <CardTitle>รายได้ 7 วันล่าสุด</CardTitle>
            </div>
            <CardDescription>Revenue (THB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyStats}>
                  <defs>
                    <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D63384" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#D63384" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle()}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} THB`,
                      "Revenue",
                    ]}
                    labelFormatter={(d) =>
                      new Date(d).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D63384"
                    strokeWidth={2.5}
                    fill="url(#pinkGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#D63384", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Models BarChart */}
        <Card className="glass-card card-enter" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-chaba-gold" />
              <CardTitle>โมเดลยอดนิยม</CardTitle>
            </div>
            <CardDescription>จำนวนการใช้งาน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.popularModels}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="model"
                    width={120}
                    tick={{ fontSize: 11, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v.length > 18 ? v.slice(0, 18) + "..." : v
                    }
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle()}
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Tasks",
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  >
                    {stats.popularModels.map((_, index) => (
                      <Cell
                        key={index}
                        fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card className="glass-card card-enter" style={{ animationDelay: "0.35s" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-chaba-pink" />
            <CardTitle>สรุปวันนี้</CardTitle>
          </div>
          <CardDescription>กิจกรรมล่าสุด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border p-5 text-center transition-all hover:shadow-md hover:border-chaba-gold/30">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chaba-gold to-chaba-gold-light" />
              <p className="text-sm text-muted-foreground mb-1">รายได้วันนี้</p>
              <p className="text-xl font-bold text-chaba-gold">
                <CountUpNumber value={stats.todayRevenue} suffix=" THB" />
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border p-5 text-center transition-all hover:shadow-md hover:border-chaba-pink/30">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chaba-pink to-chaba-pink-light" />
              <p className="text-sm text-muted-foreground mb-1">งานวันนี้</p>
              <p className="text-xl font-bold text-chaba-pink">
                <CountUpNumber value={stats.todayTasks} />
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border p-5 text-center transition-all hover:shadow-md hover:border-chaba-purple/30">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chaba-purple to-[#A29BFE]" />
              <p className="text-sm text-muted-foreground mb-1">สำเร็จ / ล้มเหลว</p>
              <p className="text-xl font-bold">
                <span className="text-emerald-600">{stats.successTasks.toLocaleString()}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-400">{stats.failedTasks.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
