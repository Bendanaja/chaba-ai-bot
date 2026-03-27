"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Banknote,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Calendar as CalendarIcon,
  Gift,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
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

function CountUpNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const animatedValue = useCountUp(value);
  return (
    <>
      {animatedValue.toLocaleString()}
      {suffix}
    </>
  );
}

/* ── Simple calendar widget ── */
function MiniCalendar() {
  const [current, setCurrent] = useState(() => new Date());
  const today = new Date();

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number | null) =>
    d !== null &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrent(new Date(year, month - 1, 1))}
          className="p-1 rounded-lg hover:bg-chaba-pink/10 text-muted-foreground hover:text-chaba-pink transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {monthNames[month]} {year + 543}
        </span>
        <button
          onClick={() => setCurrent(new Date(year, month + 1, 1))}
          className="p-1 rounded-lg hover:bg-chaba-pink/10 text-muted-foreground hover:text-chaba-pink transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {dayNames.map((dn) => (
          <div key={dn} className="py-1 text-muted-foreground font-medium">
            {dn}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={cn(
              "py-1.5 rounded-lg text-xs transition-colors",
              d === null && "invisible",
              isToday(d)
                ? "bg-chaba-pink text-white font-bold relative"
                : "text-foreground hover:bg-chaba-pink/5"
            )}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Progress ring SVG ── */
function ProgressRing({
  percent,
  size = 80,
  stroke = 6,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D63384" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
      </defs>
    </svg>
  );
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

  const customTooltipStyle = useCallback(
    () => ({
      backgroundColor: "rgba(255, 248, 240, 0.95)",
      border: "1px solid rgba(214, 51, 132, 0.2)",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: "8px 12px",
      fontSize: "13px",
    }),
    []
  );

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

  /* Build weekly chart data — revenue & spent as pink/gold bars */
  const weeklyData = stats.dailyStats.map((d) => ({
    day: new Date(d.date).toLocaleDateString("th-TH", { weekday: "short" }),
    revenue: d.revenue,
    spent: d.spent,
  }));

  /* Recent creations mock from popular models */
  const recentCreations = stats.popularModels.slice(0, 4).map((m, i) => ({
    name: m.model,
    count: m.count,
    ago: `${(i + 1) * 2} ชม.ที่แล้ว`,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมระบบ Chaba AI</p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="card-enter relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`}
            />
            <div className="flex items-center gap-4">
              <div
                className={`rounded-xl p-3 ${card.iconBg} transition-transform hover:scale-110`}
              >
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  <CountUpNumber value={card.value} suffix={card.suffix} />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* ═══ LEFT COLUMN (spans 2) ═══ */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {/* ── Large activity card with weekly BarChart ── */}
          <div
            className="card-enter rounded-2xl bg-white p-4 sm:p-6 shadow-sm"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chaba-pink" />
                <h3 className="font-semibold text-base">
                  กิจกรรมรายสัปดาห์
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-chaba-pink" />
                  รายได้
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-chaba-gold" />
                  ค่าใช้จ่าย
                </span>
              </div>
            </div>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  barGap={4}
                  margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#888" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle()}
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} THB`,
                      name === "revenue" ? "รายได้" : "ค่าใช้จ่าย",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#D63384"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="spent"
                    fill="#C8A951"
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Stats summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">รายได้วันนี้</p>
                <p className="text-base sm:text-lg font-bold text-chaba-pink">
                  <CountUpNumber value={stats.todayRevenue} suffix=" THB" />
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">งานวันนี้</p>
                <p className="text-base sm:text-lg font-bold text-chaba-purple">
                  <CountUpNumber value={stats.todayTasks} />
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">สำเร็จ / ล้มเหลว</p>
                <p className="text-base sm:text-lg font-bold">
                  <span className="text-emerald-600">
                    {stats.successTasks.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-red-400">
                    {stats.failedTasks.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Two medium cards side by side ── */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Card: การสร้างของฉัน (recent creations) */}
            <div
              className="card-enter rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-chaba-gold" />
                <h3 className="font-semibold text-sm">การสร้างของฉัน</h3>
              </div>
              <div className="space-y-3">
                {recentCreations.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chaba-purple/10 text-chaba-purple text-xs font-bold shrink-0">
                        {item.count}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name.length > 20
                            ? item.name.slice(0, 20) + "..."
                            : item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.ago}
                        </p>
                      </div>
                    </div>
                    <Flame className="h-3.5 w-3.5 text-chaba-pink opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Card: งาน (tasks) with progress ring */}
            <div
              className="card-enter rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">งาน</h3>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="relative">
                  <ProgressRing percent={successRate} size={90} stroke={7} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{successRate}%</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">สำเร็จ</span>
                    <span className="font-semibold ml-auto">
                      {stats.successTasks.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="text-muted-foreground">ล้มเหลว</span>
                    <span className="font-semibold ml-auto">
                      {stats.failedTasks.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-chaba-purple" />
                    <span className="text-muted-foreground">ทั้งหมด</span>
                    <span className="font-semibold ml-auto">
                      {stats.totalTasks.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="flex flex-col gap-5">
          {/* Calendar widget */}
          <div
            className="card-enter rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
            style={{ animationDelay: "0.25s" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-chaba-pink" />
              <h3 className="font-semibold text-sm">ปฏิทิน</h3>
            </div>
            <MiniCalendar />
          </div>

          {/* Upcoming section */}
          <div
            className="card-enter rounded-2xl bg-white p-4 sm:p-5 shadow-sm"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-chaba-purple" />
              <h3 className="font-semibold text-sm">กิจกรรมที่จะถึง</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-chaba-pink/20 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chaba-pink/10">
                  <Star className="h-4 w-4 text-chaba-pink" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">อัปเดตโมเดลใหม่</p>
                  <p className="text-xs text-muted-foreground">เร็ว ๆ นี้</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-chaba-gold/20 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chaba-gold/10">
                  <Sparkles className="h-4 w-4 text-chaba-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">บำรุงรักษาระบบ</p>
                  <p className="text-xs text-muted-foreground">สัปดาห์หน้า</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reward / promo card */}
          <div
            className="card-enter rounded-2xl overflow-hidden shadow-sm"
            style={{ animationDelay: "0.35s" }}
          >
            <div className="relative bg-gradient-to-br from-chaba-pink via-chaba-purple to-chaba-gold p-4 sm:p-5 text-white">
              <div className="absolute top-3 right-3 opacity-20">
                <Gift className="h-16 w-16" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-medium opacity-80 mb-1">
                  โปรโมชัน
                </p>
                <h4 className="font-bold text-lg leading-tight mb-2">
                  เติมเงิน 500 บาท
                  <br />
                  รับเพิ่ม 10%
                </h4>
                <p className="text-xs opacity-70">
                  เฉพาะผู้ใช้ที่ใช้งานประจำ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
