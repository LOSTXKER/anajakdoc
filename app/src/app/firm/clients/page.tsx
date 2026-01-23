import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function FirmClientsPage() {
  const session = await getSession();
  
  if (!session?.firmMembership) {
    redirect("/dashboard");
  }

  // TODO: Fetch clients from database
  const clients = [
    { id: "1", name: "บริษัท ก จำกัด", pendingDocs: 3, totalDocs: 42, status: "normal" },
    { id: "2", name: "บริษัท ข จำกัด", pendingDocs: 7, totalDocs: 89, status: "warning" },
    { id: "3", name: "บริษัท ค จำกัด", pendingDocs: 12, totalDocs: 156, status: "alert" },
    { id: "4", name: "บริษัท ง จำกัด", pendingDocs: 0, totalDocs: 23, status: "normal" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">
            จัดการลูกค้าของสำนักงาน
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่ม Client
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหา client..." className="pl-9" />
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการ Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.totalDocs} เอกสารทั้งหมด
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-medium ${client.pendingDocs > 10 ? 'text-error' : client.pendingDocs > 5 ? 'text-warning' : ''}`}>
                      {client.pendingDocs} เอกสารค้าง
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/switch-org/${client.id}`}>
                      เข้าทำงาน
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
