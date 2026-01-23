import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FirmDashboardPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/dashboard");
  }

  // TODO: Fetch real data from database
  const stats = {
    totalClients: 12,
    pendingDocs: 45,
    nearDeadline: 8,
  };

  // TODO: Fetch clients from database based on assignments
  const clients = [
    { id: "1", name: "บริษัท ก จำกัด", pendingDocs: 3, status: "normal" },
    { id: "2", name: "บริษัท ข จำกัด", pendingDocs: 7, status: "warning" },
    { id: "3", name: "บริษัท ค จำกัด", pendingDocs: 12, status: "alert" },
  ];

  // TODO: Fetch deadlines from database
  const deadlines = [
    { id: "1", title: "เอกสาร VAT", clients: ["บริษัท ก", "บริษัท ข"], date: "25 ม.ค." },
    { id: "2", title: "เอกสาร WHT", clients: ["บริษัท ค"], date: "31 ม.ค." },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            เอกสารรอดำเนินการ
          </h1>
          <p className="text-muted-foreground">
            {session.firmMembership.firmName}
          </p>
        </div>
        <Button asChild>
          <Link href="/firm/clients">
            <Briefcase className="mr-2 h-4 w-4" />
            + Client
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients ทั้งหมด</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสารค้าง</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingDocs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใกล้ Deadline</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{stats.nearDeadline}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Clients ที่ฉันดูแล</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Grid</Button>
            <Button variant="ghost" size="sm">List</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className={client.status === "alert" ? "border-error" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  {client.status === "alert" && (
                    <AlertTriangle className="h-4 w-4 text-error" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {client.pendingDocs} เอกสารรอดำเนินการ
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/switch-org/${client.id}`}>
                    เข้าทำงาน
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เอกสารใกล้ Deadline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{deadline.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {deadline.clients.join(", ")}
                  </p>
                </div>
                <span className="text-sm text-warning font-medium">
                  ส่งภายใน {deadline.date}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
