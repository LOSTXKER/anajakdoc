import { Suspense } from "react";
import { requireOrganization } from "@/server/auth";
import { getOrganizationFirmRelations } from "@/server/actions/firm-relation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, XCircle, Plus, Info } from "lucide-react";
import { InviteFirmDialog } from "./_components/invite-firm-dialog";
import { FirmRelationActions } from "./_components/firm-relation-actions";

async function FirmRelationsList() {
  const relations = await getOrganizationFirmRelations();

  if (relations.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">ยังไม่มีสำนักบัญชีดูแล</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          เชิญสำนักบัญชีมาดูแลธุรกิจของคุณเพื่อให้การจัดการเอกสารบัญชีง่ายขึ้น
        </p>
        <InviteFirmDialog />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relations.map((relation) => (
        <Card key={relation.id} className={relation.status === "ACTIVE" ? "border-green-200 dark:border-green-800" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  {relation.firmLogo ? (
                    <img src={relation.firmLogo} alt={relation.firmName} className="h-8 w-8 rounded" />
                  ) : (
                    <Building2 className="h-6 w-6 text-violet-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{relation.firmName}</h3>
                  <p className="text-sm text-muted-foreground">@{relation.firmSlug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={relation.status} />
                <FirmRelationActions relation={relation} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          กำลังดูแล
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          รอตอบรับ
        </Badge>
      );
    case "TERMINATED":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
          <XCircle className="h-3 w-3 mr-1" />
          ยกเลิกแล้ว
        </Badge>
      );
    default:
      return null;
  }
}

export default async function AccountingFirmSettingsPage() {
  await requireOrganization();

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">สำนักบัญชีที่ดูแล</h1>
          <p className="text-muted-foreground">
            จัดการสำนักบัญชีที่มีสิทธิ์เข้าถึงข้อมูลธุรกิจของคุณ
          </p>
        </div>
        <InviteFirmDialog />
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              ข้อมูลของคุณปลอดภัย
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              คุณเป็นเจ้าของข้อมูลทั้งหมด สำนักบัญชีจะเข้าถึงได้เฉพาะเมื่อคุณอนุญาต 
              และคุณสามารถยกเลิกการดูแลได้ทุกเมื่อ
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
        <FirmRelationsList />
      </Suspense>
    </div>
  );
}
