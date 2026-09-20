import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  LogOut,
  Search,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  Target,
  Award,
  Terminal,
} from "lucide-react";
import logo from "@/assets/logo.svg";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  applied: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Applied" },
  shortlisted: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Shortlisted" },
  assessment: { color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Assessment" },
  interview: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Interview" },
  selected: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Selected" },
  rejected: { color: "bg-rose-500/15 text-rose-400 border-rose-500/30", label: "Rejected" },
};

const CHART_COLORS = ["#A78BFA", "#22D3EE", "#34D399", "#FBBF24", "#F472B6", "#FB923C"];

export default function TPODashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDrive, setSelectedDrive] = useState<Id<"drives"> | null>(null);
  const [studentFilter, setStudentFilter] = useState({ department: "", minCgpa: "", maxBacklogs: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  const stats = useQuery(api.applications.getDashboardStats);
  const drivesWithCounts = useQuery(api.drives.getDrivesWithCounts);
  const students = useQuery(api.students.getAllStudents);
  const driveApplications = useQuery(
    api.applications.getApplicationsByDrive,
    selectedDrive ? { driveId: selectedDrive } : "skip"
  );

  const updateAppStatus = useMutation(api.applications.updateApplicationStatus);
  const bulkUpdate = useMutation(api.applications.bulkUpdateStatus);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await updateAppStatus({
        applicationId: appId as Id<"applications">,
        status: status as "applied" | "shortlisted" | "online_assessment" | "technical_interview" | "hr_interview" | "offered" | "rejected",
      });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedApps.length === 0) return;
    try {
      await bulkUpdate({
        applicationIds: selectedApps as Id<"applications">[],
        status: status as "applied" | "shortlisted" | "online_assessment" | "technical_interview" | "hr_interview" | "offered" | "rejected",
      });
      toast.success(`${selectedApps.length} applications updated to ${status}`);
      setSelectedApps([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const exportStudents = () => {
    const filtered = students?.filter((s) => {
      if (studentFilter.department && s.department !== studentFilter.department) return false;
      if (studentFilter.minCgpa && s.cgpa < parseFloat(studentFilter.minCgpa)) return false;
      if (studentFilter.maxBacklogs && s.activeBacklogs > parseInt(studentFilter.maxBacklogs)) return false;
      if (searchQuery && !s.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    if (!filtered || filtered.length === 0) {
      toast.error("No students match the current filters");
      return;
    }

    const headers = ["Name", "Email", "Roll Number", "Department", "CGPA", "Backlogs", "Skills", "Placed"];
    const rows = filtered.map((s) => [
      s.userName, s.userEmail, s.rollNumber, s.department,
      s.cgpa.toString(), s.activeBacklogs.toString(), s.skills.join(", "), s.placementStatus === "placed" ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Student list exported successfully");
  };

  const filteredStudents = students?.filter((s) => {
    if (studentFilter.department && s.department !== studentFilter.department) return false;
    if (studentFilter.minCgpa && s.cgpa < parseFloat(studentFilter.minCgpa)) return false;
    if (studentFilter.maxBacklogs && s.activeBacklogs > parseInt(studentFilter.maxBacklogs)) return false;
    if (searchQuery && !s.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            <span className="nb-tag bg-primary/15 text-primary border-primary/30 text-[10px]">TPO</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 border-2 border-border bg-primary/15 flex items-center justify-center text-primary font-black text-xs">
                {user?.name?.charAt(0) ?? "T"}
              </div>
              <span className="font-bold">{user?.name ?? "TPO"}</span>
            </div>
            <Button variant="outline" size="sm" className="nb-btn-secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-2 border-border bg-secondary h-auto p-0.5 mb-6 flex flex-wrap w-full sm:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="drives" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <Briefcase className="mr-1.5 h-3.5 w-3.5" />
              Drives
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Students
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Applications
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            {stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Students", value: stats.totalStudents, icon: GraduationCap, color: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Placed", value: `${stats.placementPercentage}%`, icon: Target, color: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Highest CTC", value: `₹${stats.highestCtc} LPA`, icon: Award, color: "bg-yellow-500/10 border-yellow-500/20" },
                    { label: "Active Drives", value: stats.activeDrives, icon: Briefcase, color: "bg-purple-500/10 border-purple-500/20" },
                  ].map((stat) => (
                    <Card key={stat.label} className={`nb-card ${stat.color}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-border flex items-center justify-center bg-background">
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</div>
                            <div className="font-black text-2xl">{stat.value}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="nb-card">
                    <CardHeader>
                      <CardTitle className="font-black text-sm">Department-wise Placement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.departmentStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                          <XAxis dataKey="department" tick={{ fontSize: 12, fontWeight: "bold" }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="total" fill="#1E1E22" stroke="#27272A" strokeWidth={2} name="Total" />
                          <Bar dataKey="placed" fill="#A78BFA" stroke="#27272A" strokeWidth={2} name="Placed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="nb-card">
                    <CardHeader>
                      <CardTitle className="font-black text-sm">CTC Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.ctcDistribution).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {Object.entries(stats.ctcDistribution).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} stroke="#27272A" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="nb-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Applications</div>
                      <div className="font-black text-3xl">{stats.totalApplications}</div>
                    </CardContent>
                  </Card>
                  <Card className="nb-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Students Placed</div>
                      <div className="font-black text-3xl">{stats.placedStudents}/{stats.totalStudents}</div>
                    </CardContent>
                  </Card>
                  <Card className="nb-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Average CTC</div>
                      <div className="font-black text-3xl">₹{stats.averageCtc} LPA</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Drives */}
          <TabsContent value="drives">
            <div className="mb-4">
              <h2 className="font-black text-lg">Company Drives</h2>
              <p className="text-sm text-muted-foreground">Manage placement drives and monitor applicant volumes</p>
            </div>
            <div className="grid gap-4">
              {drivesWithCounts?.map((drive) => (
                <Card key={drive._id} className={`nb-card nb-card-hover cursor-pointer ${selectedDrive === drive._id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedDrive(selectedDrive === drive._id ? null : drive._id)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black">{drive.companyName}</h3>
                          <span className={`nb-tag ${drive.status === "ongoing" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-secondary text-muted-foreground"}`}>{drive.status}</span>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">{drive.roleTitle}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="font-bold">CTC: {drive.ctc}</span>
                          <span className="font-bold">CGPA ≥ {drive.minCgpa}</span>
                          <span className="font-bold">Applicants: {drive.applicantCount}</span>
                          <span className="font-bold">Selected: {drive.selectedCount}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${selectedDrive === drive._id ? "rotate-90" : ""}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students */}
          <TabsContent value="students">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-black text-lg">Student Database</h2>
                <p className="text-sm text-muted-foreground">{filteredStudents?.length ?? 0} students matching current filters</p>
              </div>
              <Button className="nb-btn-secondary" onClick={exportStudents}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="nb-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <span className="font-bold text-xs uppercase">Filters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input className="nb-input" placeholder="Search name or roll..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="nb-input bg-background px-3 py-2 text-sm" value={studentFilter.department} onChange={(e) => setStudentFilter({ ...studentFilter, department: e.target.value })}>
                  <option value="">All Departments</option>
                  <option value="CS">CS</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </select>
                <Input className="nb-input" type="number" placeholder="Min CGPA" value={studentFilter.minCgpa} onChange={(e) => setStudentFilter({ ...studentFilter, minCgpa: e.target.value })} />
                <Input className="nb-input" type="number" placeholder="Max Backlogs" value={studentFilter.maxBacklogs} onChange={(e) => setStudentFilter({ ...studentFilter, maxBacklogs: e.target.value })} />
              </div>
            </div>

            <Card className="nb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border bg-secondary">
                      <th className="text-left p-3 font-black text-xs uppercase">Name</th>
                      <th className="text-left p-3 font-black text-xs uppercase">Roll</th>
                      <th className="text-left p-3 font-black text-xs uppercase">Dept</th>
                      <th className="text-left p-3 font-black text-xs uppercase">CGPA</th>
                      <th className="text-left p-3 font-black text-xs uppercase">Backlogs</th>
                      <th className="text-left p-3 font-black text-xs uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents?.map((student) => (
                      <tr key={student._id} className="border-b border-border hover:bg-secondary/50">
                        <td className="p-3 font-bold">{student.userName}</td>
                        <td className="p-3 text-muted-foreground font-mono text-xs">{student.rollNumber}</td>
                        <td className="p-3"><span className="nb-tag bg-secondary">{student.department}</span></td>
                        <td className="p-3 font-black">{student.cgpa}</td>
                        <td className="p-3">
                          <span className={`font-bold ${student.activeBacklogs > 0 ? "text-destructive" : ""}`}>{student.activeBacklogs}</span>
                        </td>
                        <td className="p-3">
                          {student.placementStatus === "placed" ? (
                            <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Placed</span>
                          ) : (
                            <span className="nb-tag bg-blue-500/15 text-blue-400 border-blue-500/30">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            <div className="mb-4">
              <h2 className="font-black text-lg">Application Processing</h2>
              <p className="text-sm text-muted-foreground">Select a drive to review and manage its applicant pipeline</p>
            </div>

            {!selectedDrive ? (
              <div className="grid gap-3">
                {drivesWithCounts?.filter((d) => d.applicantCount > 0).map((drive) => (
                  <Card key={drive._id} className="nb-card nb-card-hover cursor-pointer" onClick={() => setSelectedDrive(drive._id)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black">{drive.companyName}</span>
                          <span className="nb-tag bg-secondary text-[10px]">{drive.applicantCount} applicants</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{drive.roleTitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" className="nb-btn-secondary" onClick={() => { setSelectedDrive(null); setSelectedApps([]); }}>
                  ← Back to drives
                </Button>

                {selectedApps.length > 0 && (
                  <div className="nb-card p-3 bg-primary/10 border-primary/30 flex items-center gap-3">
                    <span className="font-bold text-sm">{selectedApps.length} selected</span>
                    <div className="flex gap-2 ml-auto flex-wrap">
                      {["shortlisted", "assessment", "interview", "selected", "rejected"].map((status) => (
                        <Button key={status} size="sm" variant="outline" className="nb-btn-secondary text-[10px] font-bold uppercase" onClick={() => handleBulkUpdate(status)}>
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {driveApplications?.map((app) => {
                  const statusCfg = STATUS_CONFIG[app.status] ?? { color: "", label: app.status };
                  const isSelected = selectedApps.includes(app._id);

                  return (
                    <Card key={app._id} className="nb-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={isSelected} onChange={() => {
                            setSelectedApps((prev) => isSelected ? prev.filter((id) => id !== app._id) : [...prev, app._id]);
                          }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black">{app.studentName}</span>
                              <span className={`nb-badge ${statusCfg.color}`}>{statusCfg.label}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {app.student?.rollNumber} • {app.student?.department} • CGPA {app.student?.cgpa}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {app.student?.skills.slice(0, 4).map((skill: string) => (
                                <span key={skill} className="nb-tag bg-secondary text-[9px]">{skill}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-wrap justify-end">
                            {["shortlisted", "assessment", "interview", "selected", "rejected"].map((status) => (
                              <Button key={status} size="sm" variant={app.status === status ? "default" : "outline"} className={`text-[9px] font-bold uppercase px-2 py-1 h-auto ${app.status === status ? "nb-btn-primary" : "nb-btn-secondary"}`} onClick={() => handleUpdateStatus(app._id, status)}>
                                {status === "shortlisted" ? "Short" : status === "assessment" ? "Assess" : status === "interview" ? "Interview" : status === "selected" ? "Select" : "Reject"}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
