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
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Wallet,
} from "lucide-react";

interface Transaction {
  id: number;
  user_id: string;
  display_name: string | null;
  type: "topup" | "spend" | "refund";
  amount: number;
  description: string | null;
  task_id: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "topup", label: "เติมเงิน" },
  { value: "spend", label: "ใช้จ่าย" },
  { value: "refund", label: "คืนเงิน" },
];

function typeIcon(type: string) {
  switch (type) {
    case "topup":
      return <ArrowUpCircle className="h-4 w-4 text-emerald-500" />;
    case "spend":
      return <ArrowDownCircle className="h-4 w-4 text-[#D63384]" />;
    case "refund":
      return <RotateCcw className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}

function typeBadge(type: string) {
  switch (type) {
    case "topup":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-300">
          <ArrowUpCircle className="mr-1 h-3 w-3" />
          เติมเงิน
        </Badge>
      );
    case "spend":
      return (
        <Badge className="bg-[#D63384]/10 text-[#D63384] border-0">
          <ArrowDownCircle className="mr-1 h-3 w-3" />
          ใช้จ่าย
        </Badge>
      );
    case "refund":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-900/30 dark:text-blue-300">
          <RotateCcw className="mr-1 h-3 w-3" />
          คืนเงิน
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function amountDisplay(type: string, amount: number) {
  const prefix = type === "topup" || type === "refund" ? "+" : "-";
  const color =
    type === "topup" || type === "refund"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-[#D63384]";
  return (
    <span className={`font-mono font-bold ${color}`}>
      {prefix}
      {amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
    </span>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [userIdSearch, setUserIdSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTransactions = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (userIdSearch) params.set("userId", userIdSearch);

        const res = await fetch(`/api/transactions?${params}`);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [router, typeFilter, userIdSearch]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  return (
    <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D63384]/10 to-[#C8A951]/10">
          <Wallet className="h-5 w-5 text-[#D63384]" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">รายการธุรกรรม</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            ประวัติการเติมเงิน ใช้จ่าย และคืนเงิน
          </p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">เติมเงิน</p>
              <p className="text-xs font-bold text-emerald-600 sm:text-sm">
                +
                {transactions
                  .filter((t) => t.type === "topup")
                  .reduce((s, t) => s + t.amount, 0)
                  .toLocaleString()}{" "}
                THB
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-[#D63384]/10 p-2">
              <ArrowDownCircle className="h-4 w-4 text-[#D63384]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ใช้จ่าย</p>
              <p className="text-xs font-bold text-[#D63384] sm:text-sm">
                -
                {transactions
                  .filter((t) => t.type === "spend")
                  .reduce((s, t) => s + t.amount, 0)
                  .toLocaleString()}{" "}
                THB
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <RotateCcw className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">คืนเงิน</p>
              <p className="text-xs font-bold text-blue-600 sm:text-sm">
                +
                {transactions
                  .filter((t) => t.type === "refund")
                  .reduce((s, t) => s + t.amount, 0)
                  .toLocaleString()}{" "}
                THB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v ?? "all")}
        >
          <SelectTrigger className="min-h-[44px] w-full sm:min-h-0 sm:w-[140px]">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหา User ID..."
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            className="min-h-[44px] pl-9 w-full sm:min-h-0 sm:w-[220px]"
          />
        </div>
        <div className="text-xs text-muted-foreground sm:ml-auto sm:text-sm">
          {pagination.total.toLocaleString()} รายการ
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>รายละเอียด</TableHead>
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
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Wallet className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      ไม่พบรายการ
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx, i) => (
                    <TableRow
                      key={tx.id}
                      className="group transition-colors"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tx.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {(tx.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {tx.display_name || "-"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {tx.user_id.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{typeBadge(tx.type)}</TableCell>
                      <TableCell className="text-right">
                        {amountDisplay(tx.type, tx.amount)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          THB
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] min-w-0">
                        <span className="truncate block text-xs text-muted-foreground">
                          {tx.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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
            หน้า {pagination.page} จาก {pagination.totalPages} (
            {pagination.total.toLocaleString()} รายการ)
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
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
                      onClick={() => fetchTransactions(pageNum)}
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
              onClick={() => fetchTransactions(pagination.page + 1)}
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
