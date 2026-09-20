import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Briefcase,
  LogOut,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Pencil,
  Link2,
  Github,
  Terminal,
} from "lucide-react";
import logo from "@/assets/logo.svg";

const STATUS_CONFIG = {
  applied: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Applied", icon: FileText },
  shortlisted: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Shortlisted", icon: CheckCircle2 },
  assessment: { color: "bg-purple-500/15 text-purple-400 border-purple-500/30", label: "Assessment", icon: FileText },
  interview: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Interview", icon: Clock },
  selected: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Selected", icon: CheckCircle2 },
  rejected: { color: "bg-rose-500/15 text-rose-400 border-rose-500/30", label: "Rejected", icon: XCircle },
};

const STATUS_PIPELINE = ["applied", "shortlisted", "assessment", "interview", "selected"];

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("drives");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);

  const studentProfile = useQuery(api.students.getStudentProfile);
  const activeDrives = useQuery(api.drives.getActiveDrives);
  const myApplications = useQuery(api.applications.getMyApplications);

  const createProfile = useMutation(api.students.createStudentProfile);
  const updateProfile = useMutation(api.students.updateStudentProfile);
  const applyToDrive = useMutation(api.applications.applyToDrive);

  const [profileForm, setProfileForm] = useState({
    rollNumber: "",
    department: "CS",
    cgpa: "",
    graduationYear: "2025",
    activeBacklogs: "0",
    skills: "",
    resumeUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfile({
        rollNumber: profileForm.rollNumber,
        department: profileForm.department,
        cgpa: parseFloat(profileForm.cgpa),
        graduationYear: parseInt(profileForm.graduationYear),
        activeBacklogs: parseInt(profileForm.activeBacklogs),
        skills: profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        resumeUrl: profileForm.resumeUrl || undefined,
        linkedinUrl: profileForm.linkedinUrl || undefined,
        githubUrl: profileForm.githubUrl || undefined,
      });
      toast.success("Profile created successfully");
      setShowProfileForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create profile");
    }
  };

  const handleApply = async (driveId: string) => {
    try {
      await applyToDrive({ driveId: driveId as Id<"drives"> });
      toast.success("Application submitted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isEligible = (drive: any) => {
    if (!studentProfile) return false;
    if (studentProfile.placementStatus === "placed") return false;
    if (studentProfile.cgpa < drive.minCgpa) return false;
    if (studentProfile.activeBacklogs > drive.maxActiveBacklogs) return false;
    if (!drive.allowedBranches.includes(studentProfile.department)) return false;
    return true;
  };

  const hasApplied = (driveId: string) => {
    return myApplications?.some((app) => app.driveId === driveId);
  };

  const filteredDrives = activeDrives?.filter(
    (d) =>
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Profile creation gate
  if (studentProfile === null && !showProfileForm) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b-2 border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-border bg-primary/15 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase">Placement Portal</span>
          </div>
        </nav>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <Card className="border-2 border-border shadow-none">
            <CardHeader>
              <CardTitle className="font-black text-xl">Complete Your Profile</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in your academic details to start applying for placement drives.
              </p>
            </CardHeader>
            <CardContent>
              <Button className="nb-btn-primary w-full" onClick={() => setShowProfileForm(true)}>
                Create Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b-2 border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 border-2 border-border bg-primary/15 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase">Placement Portal</span>
          </div>
        </nav>
        <div className="mx-auto max-w-lg px-4 py-10">
          <Card className="border-2 border-border shadow-none">
            <CardHeader>
              <CardTitle className="font-black text-xl">Student Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Roll Number</Label>
                    <Input className="nb-input" placeholder="CS2021001" value={profileForm.rollNumber} onChange={(e) => setProfileForm({ ...profileForm, rollNumber: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Department</Label>
                    <select className="nb-input w-full bg-background px-3 py-2 text-sm" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}>
                      <option value="CS">CS</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">CGPA</Label>
                    <Input className="nb-input" type="number" step="0.1" min="0" max="10" placeholder="8.5" value={profileForm.cgpa} onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Grad Year</Label>
                    <Input className="nb-input" type="number" placeholder="2025" value={profileForm.graduationYear} onChange={(e) => setProfileForm({ ...profileForm, graduationYear: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">Backlogs</Label>
                    <Input className="nb-input" type="number" min="0" placeholder="0" value={profileForm.activeBacklogs} onChange={(e) => setProfileForm({ ...profileForm, activeBacklogs: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase">Skills (comma-separated)</Label>
                  <Input className="nb-input" placeholder="React, Python, DSA, SQL" value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs uppercase">Resume URL</Label>
                  <Input className="nb-input" placeholder="https://drive.google.com/..." value={profileForm.resumeUrl} onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">LinkedIn</Label>
                    <Input className="nb-input" placeholder="linkedin.com/in/..." value={profileForm.linkedinUrl} onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs uppercase">GitHub</Label>
                    <Input className="nb-input" placeholder="github.com/..." value={profileForm.githubUrl} onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="nb-btn-primary flex-1">
                    Save Profile
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" className="nb-btn-secondary" onClick={() => setShowProfileForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 border-2 border-border bg-primary/15 flex items-center justify-center font-black text-xs text-primary">
                {user?.name?.charAt(0) ?? "S"}
              </div>
              <span className="font-bold">{user?.name ?? "Student"}</span>
            </div>
            <Button variant="outline" size="sm" className="nb-btn-secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Profile Banner */}
        {studentProfile && (
          <div className="nb-card p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 border-2 border-border bg-primary/15 flex items-center justify-center font-black text-lg text-primary">
              {user?.name?.charAt(0) ?? "S"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg truncate">{user?.name ?? "Student"}</h2>
                {studentProfile.placementStatus === "placed" && (
                  <span className="nb-tag bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    Placed
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                <span className="font-bold">{studentProfile.rollNumber}</span>
                <span className="text-border">•</span>
                <span>{studentProfile.department}</span>
                <span className="text-border">•</span>
                <span>CGPA {studentProfile.cgpa}</span>
                <span className="text-border">•</span>
                <span>Backlogs {studentProfile.activeBacklogs}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="nb-btn-secondary" onClick={() => setShowProfileForm(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-2 border-border bg-secondary h-auto p-0.5 mb-6 w-full sm:w-auto">
            <TabsTrigger value="drives" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <Briefcase className="mr-1.5 h-3.5 w-3.5" />
              Job Board
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              My Applications
              {myApplications && myApplications.length > 0 && (
                <span className="ml-1.5 bg-background/20 border border-current w-5 h-5 inline-flex items-center justify-center text-[10px] font-black">
                  {myApplications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2.5 border-0">
              <User className="mr-1.5 h-3.5 w-3.5" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Job Board */}
          <TabsContent value="drives">
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 nb-input" placeholder="Search by company or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            {filteredDrives && filteredDrives.length === 0 && (
              <div className="nb-card p-12 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-bold">No active drives found</p>
                <p className="text-sm text-muted-foreground mt-1">Check back later for new opportunities</p>
              </div>
            )}

            <div className="grid gap-4">
              {filteredDrives?.map((drive) => {
                const eligible = isEligible(drive);
                const applied = hasApplied(drive._id);
                const daysLeft = Math.max(0, Math.ceil((drive.deadlineTimestamp - Date.now()) / (1000 * 60 * 60 * 24)));

                return (
                  <Card key={drive._id} className="nb-card nb-card-hover overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-lg">{drive.companyName}</h3>
                                {applied && (
                                  <span className="nb-tag bg-blue-500/15 text-blue-400 border-blue-500/30">Applied</span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-muted-foreground">{drive.roleTitle}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-xl text-accent">{drive.ctc}</div>
                              <div className="text-xs text-muted-foreground font-bold">CTC</div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{drive.description}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="nb-tag bg-secondary">
                              <MapPin className="h-3 w-3 mr-1" />
                              {drive.driveDate}
                            </span>
                            <span className="nb-tag bg-secondary">CGPA ≥ {drive.minCgpa}</span>
                            <span className="nb-tag bg-secondary">Backlogs ≤ {drive.maxActiveBacklogs}</span>
                            <span className="nb-tag bg-secondary">{drive.allowedBranches.join(", ")}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-bold">
                              <Calendar className="h-3 w-3" />
                              {daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}
                            </span>
                            <span className="flex items-center gap-1 font-bold">
                              <FileText className="h-3 w-3" />
                              {drive.rounds.length} rounds
                            </span>
                          </div>
                        </div>

                        <div className="sm:w-40 border-t-2 sm:border-t-0 sm:border-l-2 border-border p-4 flex flex-col items-center justify-center gap-3">
                          {applied ? (
                            <Button variant="outline" className="nb-btn-secondary w-full" onClick={() => setActiveTab("applications")}>
                              View Status
                              <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          ) : eligible ? (
                            <Button className="nb-btn-primary w-full" onClick={() => handleApply(drive._id)}>
                              Apply Now
                              <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <div className="text-center">
                              <span className="nb-tag bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">Ineligible</span>
                              <p className="text-[10px] text-muted-foreground mt-1 font-bold">Does not meet criteria</p>
                            </div>
                          )}
                          {drive.website && (
                            <a href={drive.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold">
                              <ExternalLink className="h-3 w-3" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            {!myApplications || myApplications.length === 0 ? (
              <div className="nb-card p-12 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-bold">No applications yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse the job board and apply to drives you qualify for</p>
                <Button className="nb-btn-primary mt-4" onClick={() => setActiveTab("drives")}>
                  Browse Drives
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => {
                  const statusCfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusCfg?.icon ?? FileText;

                  return (
                    <Card key={app._id} className="nb-card">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-black">{app.drive?.companyName ?? "Unknown"}</h3>
                              <span className={`nb-badge ${statusCfg?.color ?? ""}`}>
                                <StatusIcon className="h-3 w-3 mr-1 inline" />
                                {statusCfg?.label ?? app.status}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">{app.drive?.roleTitle ?? "Unknown role"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                          </div>

                          {/* Status Pipeline */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {STATUS_PIPELINE.map((step, i) => {
                              const currentIdx = STATUS_PIPELINE.indexOf(app.status as string);
                              const isComplete = i < currentIdx;
                              const isCurrent = i === currentIdx;

                              return (
                                <div key={step} className="flex items-center gap-1">
                                  <div className={`w-6 h-6 border-2 border-border flex items-center justify-center text-[9px] font-black ${
                                    isComplete
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      : isCurrent
                                      ? "bg-primary/20 text-primary border-primary/30"
                                      : "bg-secondary text-muted-foreground"
                                  }`}>
                                    {isComplete ? "✓" : i + 1}
                                  </div>
                                  {i < STATUS_PIPELINE.length - 1 && (
                                    <div className={`w-4 h-0.5 ${i < currentIdx ? "bg-emerald-500/40" : "bg-secondary"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            {studentProfile && (
              <Card className="nb-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-black text-lg">My Profile</CardTitle>
                    <Button variant="outline" size="sm" className="nb-btn-secondary" onClick={() => setShowProfileForm(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Roll Number", value: studentProfile.rollNumber },
                      { label: "Department", value: studentProfile.department },
                      { label: "CGPA", value: studentProfile.cgpa.toString() },
                      { label: "Graduation Year", value: studentProfile.graduationYear.toString() },
                      { label: "Active Backlogs", value: studentProfile.activeBacklogs.toString() },
                      { label: "Status", value: studentProfile.placementStatus === "placed" ? "Placed ✓" : "Active" },
                    ].map((item) => (
                      <div key={item.label} className="nb-card p-3">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{item.label}</div>
                        <div className="font-black text-lg mt-1">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {studentProfile.skills.length > 0 && (
                    <div>
                      <Label className="font-bold text-xs uppercase">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {studentProfile.skills.map((skill) => (
                          <span key={skill} className="nb-tag bg-primary/15 text-primary border-primary/30">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {studentProfile.resumeUrl && (
                      <a href={studentProfile.resumeUrl} target="_blank" rel="noopener noreferrer" className="nb-tag bg-secondary hover:bg-secondary/80 transition-colors">
                        <Link2 className="h-3 w-3 mr-1" />
                        Resume
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {studentProfile.linkedinUrl && (
                      <a href={studentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="nb-tag bg-secondary hover:bg-secondary/80 transition-colors">
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {studentProfile.githubUrl && (
                      <a href={studentProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="nb-tag bg-secondary hover:bg-secondary/80 transition-colors">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
