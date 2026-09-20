import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  LogOut,
  Users,
  FileText,
  Search,
  ChevronRight,
  ExternalLink,
  MapPin,
  Terminal,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  applied: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Applied" },
  shortlisted: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Shortlisted" },
  assessment: { color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Assessment" },
  interview: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Interview" },
  selected: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Selected" },
  rejected: { color: "bg-rose-500/15 text-rose-400 border-rose-500/30", label: "Rejected" },
};

export default function CompanyDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedDrive, setSelectedDrive] = useState<Id<"drives"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const drivesWithCounts = useQuery(api.drives.getDrivesWithCounts);
  const driveApplications = useQuery(
    api.applications.getApplicationsByDrive,
    selectedDrive ? { driveId: selectedDrive } : "skip"
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const selectedDriveData = drivesWithCounts?.find((d) => d._id === selectedDrive);

  const filteredApps = driveApplications?.filter(
    (app) =>
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student?.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student?.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b-2 border-border bg-background sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-border bg-primary/15 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase">Placement Portal</span>
            <span className="nb-tag bg-secondary text-muted-foreground text-[10px]">Company</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 border-2 border-border bg-secondary flex items-center justify-center font-black text-xs">
                {user?.name?.charAt(0) ?? "C"}
              </div>
              <span className="font-bold">{user?.name ?? "Company"}</span>
            </div>
            <Button variant="outline" size="sm" className="nb-btn-secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-black text-2xl">Company Portal</h1>
          <p className="text-sm text-muted-foreground">Review applicants registered for your placement drives</p>
        </div>

        {!selectedDrive ? (
          <div className="space-y-4">
            <h2 className="font-black text-lg">Your Drives</h2>
            {drivesWithCounts?.map((drive) => (
              <Card key={drive._id} className="nb-card nb-card-hover cursor-pointer" onClick={() => setSelectedDrive(drive._id)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg">{drive.companyName}</h3>
                        <span className={`nb-tag ${drive.status === "ongoing" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-secondary text-muted-foreground"}`}>{drive.status}</span>
                      </div>
                      <p className="text-sm font-bold text-muted-foreground mb-2">{drive.roleTitle}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-bold"><MapPin className="h-3 w-3" />{drive.driveDate}</span>
                        <span className="font-bold">CTC: {drive.ctc}</span>
                        <span className="font-bold">CGPA ≥ {drive.minCgpa}</span>
                      </div>
                    </div>
                    <div className="text-center px-6">
                      <div className="font-black text-3xl">{drive.applicantCount}</div>
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">Applicants</div>
                    </div>
                    <span className="hidden md:inline-flex text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/40 active:scale-[0.98] transition-all duration-200 items-center gap-1.5 ml-4 shrink-0">
                      Screen Applicants
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 md:hidden shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" className="nb-btn-secondary" onClick={() => { setSelectedDrive(null); setSearchQuery(""); }}>
              ← Back to drives
            </Button>

            {selectedDriveData && (
              <Card className="nb-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black text-xl">{selectedDriveData.companyName}</h2>
                      <p className="text-sm font-bold text-muted-foreground">{selectedDriveData.roleTitle}</p>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="font-black text-2xl">{selectedDriveData.applicantCount}</div>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="font-black text-2xl text-emerald-400">{selectedDriveData.selectedCount}</div>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Selected</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Rounds</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDriveData.rounds.map((round, i) => (
                        <span key={i} className="nb-tag bg-secondary">{i + 1}. {round}</span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 nb-input" placeholder="Search by name, roll number, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {filteredApps && filteredApps.length === 0 && (
              <div className="nb-card p-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-bold">No applicants found</p>
              </div>
            )}

            <div className="grid gap-3">
              {filteredApps?.map((app) => {
                const statusCfg = STATUS_CONFIG[app.status] ?? { color: "", label: app.status };
                return (
                  <Card key={app._id} className="nb-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 border-2 border-border bg-primary/15 flex items-center justify-center font-black text-sm text-primary shrink-0">
                          {app.studentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black">{app.studentName}</span>
                            <span className={`nb-badge ${statusCfg.color}`}>{statusCfg.label}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {app.student?.rollNumber} • {app.student?.department} • CGPA {app.student?.cgpa}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {app.student?.skills.map((skill: string) => (
                              <span key={skill} className="nb-tag bg-secondary text-[9px]">{skill}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {app.student?.resumeUrl && (
                            <a href={app.student.resumeUrl} target="_blank" rel="noopener noreferrer" className="nb-tag bg-secondary hover:bg-secondary/80 text-[10px]">
                              <FileText className="h-3 w-3 mr-1" />
                              Resume
                              <ExternalLink className="h-2.5 w-2.5 ml-1" />
                            </a>
                          )}
                          <span className="text-[10px] text-muted-foreground font-bold">
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
