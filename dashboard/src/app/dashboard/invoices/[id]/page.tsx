"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  Receipt,
  FileText,
} from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  type: "invoice" | "quotation";
  customer_name: string;
  customer_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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

export default function InvoiceViewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 404) {
          router.replace("/dashboard/invoices");
          return;
        }
        const data = await res.json();
        setInvoice(data.invoice);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  async function updateStatus(
    newStatus: "sent" | "paid" | "cancelled"
  ) {
    if (!invoice) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังโหลด...
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const items: InvoiceItem[] = Array.isArray(invoice.items)
    ? invoice.items
    : [];

  return (
    <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toolbar - hidden when printing */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] shrink-0 sm:min-h-0 sm:min-w-0"
            onClick={() => router.push("/dashboard/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold sm:text-xl truncate">{invoice.invoice_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {statusBadge(invoice.status)}
              <span className="text-xs text-muted-foreground sm:text-sm">
                {invoice.type === "quotation" ? "ใบเสนอราคา" : "ใบเสร็จ"}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          {invoice.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              onClick={() => updateStatus("sent")}
              disabled={updating}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              ส่ง
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] text-emerald-600 hover:text-emerald-700 sm:min-h-0"
              onClick={() => updateStatus("paid")}
              disabled={updating}
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              ชำระแล้ว
            </Button>
          )}
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-red-500 hover:text-red-600 sm:min-h-0"
              onClick={() => updateStatus("cancelled")}
              disabled={updating}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              ยกเลิก
            </Button>
          )}
          <Button size="sm" className="min-h-[44px] sm:min-h-0" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" />
            พิมพ์
          </Button>
        </div>
      </div>

      {/* Invoice document */}
      <Card className="mx-auto w-full max-w-[800px] print:shadow-none print:ring-0 print:max-w-none">
        <CardContent className="p-4 sm:p-8 md:p-10 print:p-8">
          {/* Header with branding */}
          <div className="flex flex-col gap-3 border-b border-border pb-4 mb-4 sm:flex-row sm:items-start sm:justify-between sm:pb-6 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#D63384] to-[#C8A951] text-white text-sm font-bold sm:h-10 sm:w-10 sm:text-lg print:h-10 print:w-10">
                  C
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-[#D63384] to-[#C8A951] bg-clip-text text-transparent sm:text-xl print:text-xl">
                    Chaba AI
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    AI Solutions Platform
                  </p>
                </div>
              </div>
            </div>
            <div className="sm:text-right">
              <h3 className="text-xl font-bold text-[#D63384] sm:text-2xl print:text-2xl">
                {invoice.type === "quotation" ? (
                  <span className="flex items-center gap-1.5 sm:justify-end">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    ใบเสนอราคา
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 sm:justify-end">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                    ใบเสร็จรับเงิน
                  </span>
                )}
              </h3>
              <p className="mt-1 font-mono text-xs font-medium sm:text-sm print:text-sm">
                {invoice.invoice_number}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                วันที่:{" "}
                {new Date(invoice.created_at).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 sm:gap-6 sm:mb-8 print:grid-cols-2 print:mb-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                ลูกค้า
              </p>
              <p className="font-bold text-sm sm:text-base print:text-base">{invoice.customer_name}</p>
              {invoice.customer_address && (
                <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm print:text-sm">
                  {invoice.customer_address}
                </p>
              )}
              {invoice.customer_phone && (
                <p className="text-xs text-muted-foreground sm:text-sm print:text-sm">
                  โทร: {invoice.customer_phone}
                </p>
              )}
              {invoice.customer_email && (
                <p className="text-xs text-muted-foreground sm:text-sm print:text-sm">
                  {invoice.customer_email}
                </p>
              )}
            </div>
            <div className="sm:text-right print:text-right">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                สถานะ
              </p>
              <div className="sm:inline-block print:hidden">{statusBadge(invoice.status)}</div>
            </div>
          </div>

          {/* Line items table */}
          <div className="rounded-lg border overflow-hidden mb-4 sm:mb-6 print:mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm min-w-[400px] print:text-sm print:min-w-0">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-2 py-2 text-left font-medium sm:px-4 sm:py-2.5 print:px-4">#</th>
                    <th className="px-2 py-2 text-left font-medium sm:px-4 sm:py-2.5 print:px-4">
                      รายละเอียด
                    </th>
                    <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-2.5 print:px-4">
                      จำนวน
                    </th>
                    <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-2.5 print:px-4">
                      ราคา/หน่วย
                    </th>
                    <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-2.5 print:px-4">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-2 text-muted-foreground sm:px-4 sm:py-2.5 print:px-4">
                        {i + 1}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-2.5 print:px-4">{item.description}</td>
                      <td className="px-2 py-2 text-right font-mono sm:px-4 sm:py-2.5 print:px-4">
                        {item.quantity}
                      </td>
                      <td className="px-2 py-2 text-right font-mono sm:px-4 sm:py-2.5 print:px-4">
                        {item.unit_price.toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-medium sm:px-4 sm:py-2.5 print:px-4">
                        {(item.quantity * item.unit_price).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 print:w-64">
              <div className="flex justify-between py-1.5 text-xs sm:text-sm print:text-sm">
                <span className="text-muted-foreground">ราคารวม</span>
                <span className="font-mono">
                  {invoice.subtotal.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-xs sm:text-sm print:text-sm">
                <span className="text-muted-foreground">
                  ภาษี ({invoice.tax_rate}%)
                </span>
                <span className="font-mono">
                  {invoice.tax_amount.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-3">
                <span className="text-sm font-bold sm:text-base print:text-base">ยอดรวมทั้งหมด</span>
                <span className="font-mono text-base font-bold text-[#D63384] sm:text-lg print:text-lg">
                  {invoice.total.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    THB
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 rounded-lg bg-muted/30 p-3 sm:mt-8 sm:p-4 print:mt-8 print:p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                หมายเหตุ
              </p>
              <p className="text-xs whitespace-pre-wrap sm:text-sm print:text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground sm:mt-10 print:mt-10">
            <p>Chaba AI - AI Solutions Platform</p>
            <p className="mt-0.5">
              เอกสารนี้ออกโดยระบบอัตโนมัติ | {invoice.invoice_number}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
