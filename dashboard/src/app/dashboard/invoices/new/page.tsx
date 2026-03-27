"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Receipt,
  FileText,
} from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<"invoice" | "quotation">("invoice");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(7);
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string) {
    const updated = [...items];
    if (field === "description") {
      updated[index].description = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setItems(updated);
  }

  async function handleSave(status: "draft" | "sent") {
    if (!customerName.trim()) {
      alert("กรุณากรอกชื่อลูกค้า");
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      alert("กรุณาเพิ่มรายการสินค้า/บริการอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          customer_name: customerName,
          customer_address: customerAddress,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          items: items.filter((i) => i.description.trim()),
          tax_rate: taxRate,
          notes,
          status,
        }),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await res.json();
      if (data.invoice) {
        router.push(`/dashboard/invoices/${data.invoice.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/invoices")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">สร้างเอกสารใหม่</h1>
          <p className="text-sm text-muted-foreground">
            สร้างใบเสร็จหรือใบเสนอราคา
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: form */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Document type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D63384]" />
                ประเภทเอกสาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={docType === "invoice" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDocType("invoice")}
                >
                  <Receipt className="mr-1.5 h-4 w-4" />
                  ใบเสร็จ
                </Button>
                <Button
                  variant={docType === "quotation" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDocType("quotation")}
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  ใบเสนอราคา
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลลูกค้า</CardTitle>
              <CardDescription>กรอกข้อมูลลูกค้า</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">ชื่อลูกค้า *</Label>
                  <Input
                    id="name"
                    placeholder="ชื่อบริษัทหรือชื่อลูกค้า"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">ที่อยู่</Label>
                  <Input
                    id="address"
                    placeholder="ที่อยู่สำหรับออกใบเสร็จ"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">เบอร์โทร</Label>
                  <Input
                    id="phone"
                    placeholder="0XX-XXX-XXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>รายการสินค้า / บริการ</CardTitle>
                  <CardDescription>เพิ่มรายการที่ต้องการ</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  เพิ่มรายการ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">รายละเอียด</TableHead>
                    <TableHead className="w-[15%] text-right">
                      จำนวน
                    </TableHead>
                    <TableHead className="w-[20%] text-right">
                      ราคาต่อหน่วย
                    </TableHead>
                    <TableHead className="w-[18%] text-right">รวม</TableHead>
                    <TableHead className="w-[7%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          placeholder="รายละเอียดสินค้า/บริการ"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(i, "description", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="text-right"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(i, "quantity", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="text-right"
                          value={item.unit_price || ""}
                          onChange={(e) =>
                            updateItem(i, "unit_price", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {(item.quantity * item.unit_price).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeItem(i)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      ราคารวมก่อนภาษี
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {subtotal.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-medium">
                      ภาษี
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20 text-right ml-auto"
                        value={taxRate}
                        onChange={(e) =>
                          setTaxRate(parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {taxAmount.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right text-base font-bold">
                      ยอดรวมทั้งหมด
                    </TableCell>
                    <TableCell className="text-right font-mono text-base font-bold text-[#D63384]">
                      {total.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>หมายเหตุ</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column: summary & actions */}
        <div className="flex flex-col gap-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>สรุป</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ประเภท</span>
                  <span className="font-medium">
                    {docType === "invoice" ? "ใบเสร็จ" : "ใบเสนอราคา"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ลูกค้า</span>
                  <span className="font-medium truncate ml-2">
                    {customerName || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">จำนวนรายการ</span>
                  <span className="font-medium">
                    {items.filter((i) => i.description.trim()).length} รายการ
                  </span>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ราคารวม</span>
                  <span className="font-mono">
                    {subtotal.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ภาษี ({taxRate}%)
                  </span>
                  <span className="font-mono">
                    {taxAmount.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-bold">ยอดรวมทั้งหมด</span>
                  <span className="font-mono text-lg font-bold text-[#D63384]">
                    {total.toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <span className="text-right text-xs text-muted-foreground">
                  THB
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleSave("draft")}
              variant="outline"
              disabled={saving}
              className="w-full"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกแบบร่าง"}
            </Button>
            <Button
              onClick={() => handleSave("sent")}
              disabled={saving}
              className="w-full"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกและส่ง"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
