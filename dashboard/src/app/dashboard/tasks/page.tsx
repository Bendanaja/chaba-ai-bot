"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Cpu,
} from "lucide-react";

interface Task {
  task_id: string;
  user_id: string;
  display_name: string | null;
  model: string;
  api_type: string;
  prompt: string | null;
  status: string;
  result_url: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "processing", label: "กำลังทำ" },
  { value: "completed", label: "สำเร็จ" },
  { value: "failed", label: "ล้มเหลว" },
];

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          สำเร็จ
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-300">
          <Clock className="mr-1 h-3 w-3" />
          รอดำเนินการ
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-900/30 dark:text-blue-300">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          กำลังทำ
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-600 border-0 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="mr-1 h-3 w-3" />
          ล้มเหลว
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [modelSearch, setModelSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTasks = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (modelSearch) params.set("model", modelSearch);

        const res = await fetch(`/api/tasks?${params}`);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setTasks(data.tasks);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [router, statusFilter, modelSearch]
  );

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.filter(
    (t) => t.status === "pending" || t.status === "processing"
  ).length;

  return (
    <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D63384]/10 to-[#C8A951]/10">
          <Sparkles className="h-5 w-5 text-[#D63384]" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">งาน AI ทั้งหมด</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            ประวัติการสร้างงาน AI ทุกโมเดล
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">สำเร็จ</p>
              <p className="text-xs font-bold text-emerald-600 sm:text-sm">
                {completedCount} งาน
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
              <p className="text-xs font-bold text-amber-600 sm:text-sm">
                {pendingCount} งาน
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ล้มเหลว</p>
              <p className="text-xs font-bold text-red-600 sm:text-sm">
                {failedCount} งาน
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? "all")}
        >
          <SelectTrigger className="min-h-[44px] w-full sm:min-h-0 sm:w-[160px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาโมเดล..."
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            className="min-h-[44px] pl-9 w-full sm:min-h-0 sm:w-[200px]"
          />
        </div>
        <div className="text-xs text-muted-foreground sm:ml-auto sm:text-sm">
          {pagination.total.toLocaleString()} งาน
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Task ID</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>โมเดล</TableHead>
                  <TableHead className="max-w-[250px]">Prompt</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="w-[60px]">ผลลัพธ์</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      ไม่พบงาน
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task, i) => (
                    <TableRow
                      key={task.task_id}
                      className="group transition-colors"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {task.task_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {(task.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {task.display_name || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {task.user_id.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            {task.model.length > 20
                              ? task.model.slice(0, 20) + "..."
                              : task.model}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <span
                          className="block truncate text-xs text-muted-foreground"
                          title={task.prompt || ""}
                        >
                          {task.prompt
                            ? task.prompt.length > 60
                              ? task.prompt.slice(0, 60) + "..."
                              : task.prompt
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(task.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {task.result_url ? (
                          <a
                            href={task.result_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-[#D63384]/10 px-2 py-1 text-xs font-medium text-[#D63384] transition-colors hover:bg-[#D63384]/20 min-h-[44px] sm:min-h-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                            ดู
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            หน้า {pagination.page} จาก {pagination.totalPages} (
            {pagination.total.toLocaleString()} งาน)
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              disabled={pagination.page <= 1}
              onClick={() => fetchTasks(pagination.page - 1)}
            >
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </Button>
            <div className="hidden items-center gap-1 sm:flex">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? "default" : "ghost"
                      }
                      size="icon-xs"
                      onClick={() => fetchTasks(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>
            <span className="text-xs text-muted-foreground sm:hidden">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTasks(pagination.page + 1)}
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ArrowRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
