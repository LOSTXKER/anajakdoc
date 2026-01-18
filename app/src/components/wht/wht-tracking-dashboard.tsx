"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  Send,
  AlertTriangle,
} from "lucide-react";
import { WHTTrackingCard } from "./wht-tracking-card";
import type { SerializedWHTTracking } from "@/types";

interface WHTTrackingDashboardProps {
  outgoingTrackings: SerializedWHTTracking[];
  incomingTrackings: SerializedWHTTracking[];
  summary: {
    outgoing: { pending: number; sent: number };
    incoming: { pending: number; received: number };
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ต้องส่งออก</p>
                <p className="text-2xl font-bold">{summary.outgoing.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Send className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ส่งแล้วรอยืนยัน</p>
                <p className="text-2xl font-bold">{summary.outgoing.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowDownLeft className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รอรับเข้า</p>
                <p className="text-2xl font-bold">{summary.incoming.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ได้รับแล้ว</p>
                <p className="text-2xl font-bold">{summary.incoming.received}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            ต้องส่งออก
            {outgoingPending.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {outgoingPending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            รอรับเข้า
            {incomingPending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {incomingPending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Outgoing Tab */}
        <TabsContent value="outgoing" className="space-y-6">
          {/* Pending Section */}
          {outgoingPending.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  รอออกเอกสาร / รอส่ง
                  <Badge variant="outline">{outgoingPending.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingPending.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sent Section */}
          {outgoingSent.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" />
                  ส่งแล้ว รอยืนยันรับ
                  <Badge variant="outline">{outgoingSent.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingSent.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Confirmed Section */}
          {outgoingConfirmed.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  ยืนยันรับแล้ว
                  <Badge variant="outline">{outgoingConfirmed.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingConfirmed.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {outgoingTrackings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-1">ไม่มีรายการ WHT ที่ต้องส่งออก</h3>
              <p className="text-sm">หนังสือหัก ณ ที่จ่ายที่ต้องส่งให้คู่ค้าจะแสดงที่นี่</p>
            </div>
          )}
        </TabsContent>

        {/* Incoming Tab */}
        <TabsContent value="incoming" className="space-y-6">
          {/* Pending Section */}
          {incomingPending.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  รอรับจากลูกค้า
                  <Badge variant="outline">{incomingPending.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingPending.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Received Section */}
          {incomingReceived.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  ได้รับแล้ว
                  <Badge variant="outline">{incomingReceived.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingReceived.map((tracking) => (
                  <WHTTrackingCard key={tracking.id} tracking={tracking} showDocument />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {incomingTrackings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowDownLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-1">ไม่มีรายการ WHT ที่รอรับเข้า</h3>
              <p className="text-sm">หนังสือหัก ณ ที่จ่ายที่รอรับจากลูกค้าจะแสดงที่นี่</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
