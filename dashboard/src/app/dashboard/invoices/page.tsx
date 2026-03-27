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
  Search,
  ArrowLeft,
  ArrowRight,
  Plus,
  FileText,
  Receipt,
} from "lucide-react";

interface Invoice {
  id: number;
  invoice_number: string;
  type: "invoice" | "quotation";
  customer_name: string;
  total: number;
  status: "draft" | "sent" | "paid" | "cancelled";
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
  { value: "draft", label: "แบบร่าง" },
  { value: "sent", label: "ส่งแล้ว" },
  { value: "paid", label: "ชำระแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "ทุกประเภท" },
  { value: "invoice", label: "ใบเสร็จ" },
  { value: "quotation", label: "ใบเสนอราคา" },
];

function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return (
        <Badge className="bg-gray-100 text-gray-600 border-0 dark:bg-gray-800 dark:text-gray-300">
          แบบร่าง
        </Badge>
      );
    case "sent":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-900/30 dark:text-blue-300">
          ส่งแล้ว
        </Badge>
      );
    case "paid":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-300">
          ชำระแล้ว
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-600 border-0 dark:bg-red-900/30 dark:text-red-300">
          ยกเลิก
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function typeBadge(type: string) {
  if (type === "quotation") {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-300">
        <FileText className="mr-1 h-3 w-3" />
        ใบเสนอราคา
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#D63384]/10 text-[#D63384] border-0">
      <Receipt className="mr-1 h-3 w-3" />
      ใบเสร็จ
    </Badge>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchInvoices = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/invoices?${params}`);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setInvoices(data.invoices || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [router, statusFilter, typeFilter, searchQuery]
  );

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  return (
    <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">ใบเสร็จ / ใบเสนอราคา</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            จัดการใบเสร็จและใบเสนอราคาทั้งหมด
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => router.push("/dashboard/invoices/new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          สร้างใหม่
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: "ทั้งหมด",
            value: pagination.total,
            color: "text-foreground",
          },
          {
            label: "แบบร่าง",
            value: invoices.filter((i) => i.status === "draft").length,
            color: "text-gray-500",
          },
          {
            label: "ส่งแล้ว",
            value: invoices.filter((i) => i.status === "sent").length,
            color: "text-blue-600",
          },
          {
            label: "ชำระแล้ว",
            value: invoices.filter((i) => i.status === "paid").length,
            color: "text-emerald-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="px-3 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold sm:text-lg ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex gap-2 sm:gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="min-h-[44px] w-full sm:min-h-0 sm:w-[140px]">
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
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v ?? "all")}
          >
            <SelectTrigger className="min-h-[44px] w-full sm:min-h-0 sm:w-[150px]">
              <SelectValue placeholder="ประเภท" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาลูกค้า / เลขที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[44px] pl-9 w-full sm:min-h-0 sm:w-[220px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">ยอดรวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      ไม่พบรายการ
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv, i) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer transition-colors"
                      style={{ animationDelay: `${i * 30}ms` }}
                      onClick={() =>
                        router.push(`/dashboard/invoices/${inv.id}`)
                      }
                    >
                      <TableCell className="font-mono text-xs font-medium text-[#D63384] sm:text-sm">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>{typeBadge(inv.type)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {inv.customer_name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {inv.total.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs text-muted-foreground">
                          THB
                        </span>
                      </TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground sm:text-sm">
                        {new Date(inv.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
            ทั้งหมด {pagination.total.toLocaleString()} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              disabled={pagination.page <= 1}
              onClick={() => fetchInvoices(pagination.page - 1)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchInvoices(pagination.page + 1)}
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
