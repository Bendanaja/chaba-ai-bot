"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

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
      return <Badge className="bg-emerald-100 text-emerald-700 border-0">สำเร็จ</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 border-0">รอ</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-700 border-0">กำลังทำ</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-700 border-0">ล้มเหลว</Badge>;
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
    [router, statusFilter]
  );

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">งานทั้งหมด</h1>
        <p className="text-sm text-muted-foreground">
          ประวัติการสร้างงาน AI
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
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
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>โมเดล</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผลลัพธ์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    ไม่พบงาน
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-mono text-xs">
                      {task.task_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{task.display_name || "-"}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {task.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{task.model}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-xs text-muted-foreground"
                      title={task.prompt || ""}
                    >
                      {task.prompt
                        ? task.prompt.length > 50
                          ? task.prompt.slice(0, 50) + "..."
                          : task.prompt
                        : "-"}
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
                          className="inline-flex items-center gap-1 text-xs text-[#D63384] hover:underline"
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            ทั้งหมด {pagination.total.toLocaleString()} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchTasks(pagination.page - 1)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              ก่อนหน้า
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTasks(pagination.page + 1)}
            >
              ถัดไป
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
