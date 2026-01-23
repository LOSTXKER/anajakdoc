"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  Send,
  Receipt,
} from "lucide-react";
import { WHTTrackingCard } from "./wht-tracking-card";
import { formatMoney } from "@/lib/formatters";
import type { SerializedWhtTracking } from "@/types";

interface WHTTrackingDashboardProps {
  outgoingTrackings: SerializedWhtTracking[];
  incomingTrackings: SerializedWhtTracking[];
  summary: {
    outgoing: { pending: number; pendingAmount: number; sent: number; sentAmount: number };
    incoming: { pending: number; pendingAmount: number; received: number; receivedAmount: number };
  };
}

export function WHTTrackingDashboard({
  outgoingTrackings,
  incomingTrackings,
  summary,
}: WHTTrackingDashboardProps) {
  const [activeTab, setActiveTab] = useState("outgoing");

  const outgoingPending = outgoingTrackings.filter(t => ["PENDING", "ISSUED"].includes(t.status));
  const outgoingSent = outgoingTrackings.filter(t => t.status === "SENT");
  const outgoingConfirmed = outgoingTrackings.filter(t => t.status === "CONFIRMED");

  const incomingPending = incomingTrackings.filter(t => t.status === "PENDING");
  const incomingReceived = incomingTrackings.filter(t => t.status === "RECEIVED");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">ต้องส่งออก</p>
              <p className="text-2xl font-bold text-gray-900">{summary.outgoing.pending}</p>
              {summary.outgoing.pendingAmount > 0 && (
                <p className="text-xs text-orange-600 font-medium truncate">
                  {formatMoney(summary.outgoing.pendingAmount)} ฿
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">ส่งแล้วรอยืนยัน</p>
              <p className="text-2xl font-bold text-gray-900">{summary.outgoing.sent}</p>
              {summary.outgoing.sentAmount > 0 && (
                <p className="text-xs text-violet-600 font-medium truncate">
                  {formatMoney(summary.outgoing.sentAmount)} ฿
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="h-5 w-5 text-sky-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">รอรับเข้า</p>
              <p className="text-2xl font-bold text-gray-900">{summary.incoming.pending}</p>
              {summary.incoming.pendingAmount > 0 && (
                <p className="text-xs text-sky-600 font-medium truncate">
                  {formatMoney(summary.incoming.pendingAmount)} ฿
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">ได้รับแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{summary.incoming.received}</p>
              {summary.incoming.receivedAmount > 0 && (
                <p className="text-xs text-emerald-600 font-medium truncate">
                  {formatMoney(summary.incoming.receivedAmount)} ฿
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80">
          <TabsTrigger value="outgoing" className="gap-2 data-[state=active]:bg-white">
            <ArrowUpRight className="h-4 w-4" />
            ต้องส่งออก
            {outgoingPending.length > 0 && (
              <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                {outgoingPending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2 data-[state=active]:bg-white">
            <ArrowDownLeft className="h-4 w-4" />
            รอรับเข้า
            {incomingPending.length > 0 && (
              <span className="text-xs bg-sky-500 text-white px-1.5 py-0.5 rounded-full">
                {incomingPending.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Outgoing Tab */}
        <TabsContent value="outgoing" className="mt-4 space-y-6">
          {/* Pending Section */}
          {outgoingPending.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-gray-900">รอออกเอกสาร / รอส่ง</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {outgoingPending.length}
                </span>
              </div>
              <div className="space-y-3">
                {outgoingPending.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </div>
            </div>
          )}

          {/* Sent Section */}
          {outgoingSent.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Send className="h-4 w-4 text-violet-500" />
                <span className="font-medium text-gray-900">ส่งแล้ว รอยืนยันรับ</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {outgoingSent.length}
                </span>
              </div>
              <div className="space-y-3">
                {outgoingSent.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Section */}
          {outgoingConfirmed.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-gray-900">ยืนยันรับแล้ว</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {outgoingConfirmed.length}
                </span>
              </div>
              <div className="space-y-3">
                {outgoingConfirmed.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {outgoingTrackings.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="ไม่มีรายการ WHT ที่ต้องส่งออก"
              description="หนังสือหัก ณ ที่จ่ายที่ต้องส่งให้คู่ค้าจะแสดงที่นี่"
            />
          )}
        </TabsContent>

        {/* Incoming Tab */}
        <TabsContent value="incoming" className="mt-4 space-y-6">
          {/* Pending Section */}
          {incomingPending.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-gray-900">รอรับจากลูกค้า</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {incomingPending.length}
                </span>
              </div>
              <div className="space-y-3">
                {incomingPending.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </div>
            </div>
          )}

          {/* Received Section */}
          {incomingReceived.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-gray-900">ได้รับแล้ว</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {incomingReceived.length}
                </span>
              </div>
              <div className="space-y-3">
                {incomingReceived.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {incomingTrackings.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="ไม่มีรายการ WHT ที่รอรับเข้า"
              description="หนังสือหัก ณ ที่จ่ายที่รอรับจากลูกค้าจะแสดงที่นี่"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
