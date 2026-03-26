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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";

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

function typeBadge(type: string) {
  switch (type) {
    case "topup":
      return <Badge className="bg-emerald-100 text-emerald-700 border-0">topup</Badge>;
    case "spend":
      return <Badge className="bg-[#D63384]/10 text-[#D63384] border-0">spend</Badge>;
    case "refund":
      return <Badge className="bg-blue-100 text-blue-700 border-0">refund</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">รายการธุรกรรม</h1>
        <p className="text-sm text-muted-foreground">
          ประวัติการเติมเงิน ใช้จ่าย และคืนเงิน
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
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
            className="pl-9 w-[200px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    ไม่พบรายการ
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{tx.display_name || "-"}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {tx.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{typeBadge(tx.type)}</TableCell>
                    <TableCell className="font-medium">
                      {tx.amount.toLocaleString()} THB
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {tx.description || "-"}
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
              onClick={() => fetchTransactions(pagination.page - 1)}
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
              onClick={() => fetchTransactions(pagination.page + 1)}
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
