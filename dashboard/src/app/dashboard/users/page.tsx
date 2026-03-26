"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Search, Plus, ArrowLeft, ArrowRight } from "lucide-react";

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
    fetchUsers(1, search);
  }, [fetchUsers, search]);

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
      return <Badge className="bg-emerald-100 text-emerald-700 border-0">{balance.toLocaleString()} THB</Badge>;
    if (balance > 0)
      return <Badge className="bg-yellow-100 text-yellow-700 border-0">{balance.toLocaleString()} THB</Badge>;
    return <Badge className="bg-gray-100 text-gray-500 border-0">{balance.toLocaleString()} THB</Badge>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ผู้ใช้</h1>
        <p className="text-sm text-muted-foreground">
          จัดการผู้ใช้ทั้งหมดในระบบ
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาผู้ใช้..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ยอดเงิน</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>สร้างเมื่อ</TableHead>
                <TableHead className="text-right">เติมเงิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    ไม่พบผู้ใช้
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-mono text-xs">
                      {user.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{user.display_name || "-"}</TableCell>
                    <TableCell>{balanceBadge(user.balance)}</TableCell>
                    <TableCell>{user.task_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("th-TH")}
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
                            <Button variant="outline" size="sm" />
                          }
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          เติมเงิน
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>เติมเงิน</DialogTitle>
                            <DialogDescription>
                              เติมเงินให้ {user.display_name || user.user_id.slice(0, 8)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-3 py-2">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="topup-amount">จำนวนเงิน (THB)</Label>
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
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleTopup}
                              disabled={topupLoading || !topupAmount}
                              className="bg-gradient-to-r from-[#D63384] to-[#6C5CE7] text-white"
                            >
                              {topupLoading ? "กำลังเติม..." : "เติมเงิน"}
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
              onClick={() => fetchUsers(pagination.page - 1, search)}
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
              onClick={() => fetchUsers(pagination.page + 1, search)}
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
