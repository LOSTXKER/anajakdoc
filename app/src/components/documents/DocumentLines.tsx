"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, GripVertical, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface DocumentLine {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface DocumentLinesProps {
  lines: DocumentLine[];
  onChange: (lines: DocumentLine[]) => void;
  readOnly?: boolean;
}

export function DocumentLines({ lines, onChange, readOnly = false }: DocumentLinesProps) {
  const addLine = () => {
    const newLine: DocumentLine = {
      id: `temp-${Date.now()}`,
      lineNumber: lines.length + 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    onChange([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index).map((line, i) => ({
      ...line,
      lineNumber: i + 1,
    }));
    onChange(newLines);
  };

  const updateLine = (index: number, field: keyof DocumentLine, value: string | number) => {
    const newLines = [...lines];
    const line = { ...newLines[index] };

    if (field === "description") {
      line.description = value as string;
    } else if (field === "quantity" || field === "unitPrice") {
      const numValue = parseFloat(value as string) || 0;
      if (field === "quantity") {
        line.quantity = numValue;
      } else {
        line.unitPrice = numValue;
      }
      line.amount = line.quantity * line.unitPrice;
    }

    newLines[index] = line;
    onChange(newLines);
  };

  const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);

  if (readOnly && lines.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">รายการ ({lines.length})</CardTitle>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="ยังไม่มีรายการ"
            className="py-4"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {!readOnly && <TableHead className="w-[40px]"></TableHead>}
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[100px] text-right">จำนวน</TableHead>
                  <TableHead className="w-[120px] text-right">ราคา/หน่วย</TableHead>
                  <TableHead className="w-[120px] text-right">รวม</TableHead>
                  {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={line.id}>
                    {!readOnly && (
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{line.lineNumber}</TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span>{line.description || "-"}</span>
                      ) : (
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                          placeholder="รายละเอียด..."
                          className="h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-right block">{line.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, "quantity", e.target.value)}
                          className="h-8 text-right"
                          min="0"
                          step="any"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-right block">
                          ฿{line.unitPrice.toLocaleString()}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                          className="h-8 text-right"
                          min="0"
                          step="0.01"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{line.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Total */}
            <div className="flex justify-end">
              <div className="w-[250px] p-3 rounded-lg bg-muted">
                <div className="flex justify-between font-medium">
                  <span>รวมทั้งหมด</span>
                  <span>฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
