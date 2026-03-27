"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  Wallet,
  Loader2,
  UserCircle,
} from "lucide-react";

interface User {
  user_id: string;
  display_name: string | null;
  balance: number;
  selected_model: string;
  task_count: number;
  tx_count: number;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [topupUserId, setTopupUserId] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchUsers = useCallback(
    async (page: number, searchQuery: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/users?${params}`);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchUsers(1, "");
  }, [fetchUsers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(1, value);
    }, 400);
  }

  async function handleTopup() {
    if (!topupUserId || !topupAmount) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    setTopupLoading(true);
    try {
      const res = await fetch(`/api/users/${topupUserId}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setTopupOpen(false);
        setTopupAmount("");
        setTopupUserId(null);
        fetchUsers(pagination.page, search);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTopupLoading(false);
    }
  }

  function balanceBadge(balance: number) {
    if (balance > 100)
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">
          {balance.toLocaleString()} THB
        </Badge>
      );
    if (balance > 0)
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 font-medium">
          {balance.toLocaleString()} THB
        </Badge>
      );
    return (
      <Badge className="bg-gray-100 text-gray-500 border-0 font-medium">
        {balance.toLocaleString()} THB
      </Badge>
    );
  }

  const quickAmounts = [50, 100, 500, 1000];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-chaba-pink" />
          <h1 className="text-2xl font-bold">ผู้ใช้</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          จัดการผู้ใช้ทั้งหมดในระบบ
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาผู้ใช้..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white/80"
        />
      </div>

      {/* Users table in white rounded card */}
      <div
        className="card-enter rounded-2xl bg-white shadow-sm overflow-hidden"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-base">
              <UserCircle className="h-4 w-4 text-chaba-pink" />
              รายชื่อผู้ใช้
            </h3>
            <p className="text-sm text-muted-foreground">
              ทั้งหมด {pagination.total.toLocaleString()} คน
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead>User ID</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ยอดเงิน</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>สร้างเมื่อ</TableHead>
              <TableHead className="text-right">เติมเงิน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  ไม่พบผู้ใช้
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.user_id}
                  className="group transition-colors hover:bg-chaba-pink/[0.03]"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {user.user_id.slice(0, 10)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.display_name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{balanceBadge(user.balance)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-chaba-purple/10 px-2 py-0.5 text-xs font-medium text-chaba-purple">
                      {user.selected_model}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {user.task_count.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={topupOpen && topupUserId === user.user_id}
                      onOpenChange={(open) => {
                        setTopupOpen(open);
                        if (open) {
                          setTopupUserId(user.user_id);
                          setTopupAmount("");
                        }
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            className="opacity-60 group-hover:opacity-100 transition-opacity hover:border-chaba-pink/30 hover:text-chaba-pink"
                          />
                        }
                      >
                        <Wallet className="mr-1 h-3 w-3" />
                        เติมเงิน
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-chaba-pink" />
                            เติมเงิน
                          </DialogTitle>
                          <DialogDescription>
                            เติมเงินให้{" "}
                            <span className="font-medium text-foreground">
                              {user.display_name || user.user_id.slice(0, 10)}
                            </span>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-2">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="topup-amount">
                              จำนวนเงิน (THB)
                            </Label>
                            <Input
                              id="topup-amount"
                              type="number"
                              min="1"
                              max="100000"
                              placeholder="0"
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {quickAmounts.map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setTopupAmount(String(amt))}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                  topupAmount === String(amt)
                                    ? "border-chaba-pink bg-chaba-pink/10 text-chaba-pink"
                                    : "border-border text-muted-foreground hover:border-chaba-pink/30 hover:text-chaba-pink"
                                }`}
                              >
                                +{amt.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleTopup}
                            disabled={topupLoading || !topupAmount}
                            className="btn-chaba text-white shadow-md"
                          >
                            {topupLoading ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                กำลังเติม...
                              </>
                            ) : (
                              <>
                                <Plus className="mr-1 h-3 w-3" />
                                เติมเงิน
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            หน้า {pagination.page} จาก {pagination.totalPages} (
            {pagination.total.toLocaleString()} รายการ)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1, search)}
              className="hover:border-chaba-pink/30 hover:text-chaba-pink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from(
              { length: Math.min(pagination.totalPages, 5) },
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
                      pagination.page === pageNum ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => fetchUsers(pageNum, search)}
                    className={
                      pagination.page === pageNum
                        ? "btn-chaba text-white border-0"
                        : "hover:border-chaba-pink/30 hover:text-chaba-pink"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1, search)}
              className="hover:border-chaba-pink/30 hover:text-chaba-pink"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
