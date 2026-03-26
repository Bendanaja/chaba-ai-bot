"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, DollarSign, Sparkles, CheckCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  totalRefunded: number;
  activeTasks: number;
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">
          Loading stats...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const successRate =
    stats.totalTasks > 0
      ? ((stats.successTasks / stats.totalTasks) * 100).toFixed(1)
      : "0";

  const statCards = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-[#D63384]",
      bg: "bg-[#D63384]/10",
    },
    {
      title: "รายได้รวม",
      value: `${stats.totalRevenue.toLocaleString()} THB`,
      icon: DollarSign,
      color: "text-[#C8A951]",
      bg: "bg-[#C8A951]/10",
    },
    {
      title: "งานทั้งหมด",
      value: stats.totalTasks.toLocaleString(),
      icon: Sparkles,
      color: "text-[#D63384]",
      bg: "bg-[#D63384]/10",
    },
    {
      title: "อัตราสำเร็จ",
      value: `${successRate}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมระบบ Chaba AI
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-4 px-4 py-4">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>รายได้ 7 วันล่าสุด</CardTitle>
            <CardDescription>Revenue (THB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
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
                    fill="#D63384"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Models Chart */}
        <Card>
          <CardHeader>
            <CardTitle>โมเดลยอดนิยม</CardTitle>
            <CardDescription>จำนวนการใช้งาน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.popularModels}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="model"
                    width={120}
                    className="text-xs"
                    tickFormatter={(v) =>
                      v.length > 18 ? v.slice(0, 18) + "..." : v
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Tasks",
                    ]}
                  />
                  <Bar dataKey="count" fill="#D63384" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปวันนี้</CardTitle>
          <CardDescription>กิจกรรมล่าสุด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">รายได้วันนี้</p>
              <p className="text-lg font-bold text-[#C8A951]">
                {stats.todayRevenue.toLocaleString()} THB
              </p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">งานวันนี้</p>
              <p className="text-lg font-bold text-[#D63384]">
                {stats.todayTasks.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">งานที่กำลังทำ</p>
              <p className="text-lg font-bold">
                {stats.activeTasks.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
