import {
  Project,
  SchedulePlanItem,
  ReportItem,
  ExtractedActivity,
  ScheduleMatch,
  UnmatchedActivity,
  TeamMember,
  AuditTrailEntry,
  ProjectAnalytics,
  CandidateMatch,
  ProjectNotification,
  FieldUpdateRecord,
} from '../lib/types';
import {
  initialProjects,
  initialSchedulePlan,
  initialReports,
  initialActivities,
  initialMatches,
  initialUnmatched,
  initialTeamMembers,
  initialAuditLogs,
  initialProjectAnalytics,
  initialNotifications,
  initialFieldUpdates,
} from '../mocks';

// In-memory / localStorage state holders
function loadState<T>(key: string, initial: T): T {
  try {
    const saved = localStorage.getItem(`onground_${key}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(`Error loading state ${key}`, e);
  }
  return initial;
}

function saveState<T>(key: string, data: T) {
  try {
    localStorage.setItem(`onground_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving state ${key}`, e);
  }
}

let projectsState: Project[] = loadState('projects', initialProjects);
let scheduleState: SchedulePlanItem[] = loadState('schedule', initialSchedulePlan);
let reportsState: ReportItem[] = loadState('reports', initialReports);
let activitiesState: ExtractedActivity[] = loadState('activities', initialActivities);
let matchesState: ScheduleMatch[] = loadState('matches', initialMatches);
let unmatchedState: UnmatchedActivity[] = loadState('unmatched', initialUnmatched);
let teamState: TeamMember[] = loadState('team', initialTeamMembers);
let auditState: AuditTrailEntry[] = loadState('audit', initialAuditLogs);
let notificationsState: ProjectNotification[] = loadState('notifications', initialNotifications);
let fieldUpdatesState: FieldUpdateRecord[] = loadState('field_updates', initialFieldUpdates);

// Simulated async delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  // Projects
  async getProjects(): Promise<Project[]> {
    await delay(150);
    return [...projectsState];
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    await delay(100);
    return projectsState.find((p) => p.id === id) || projectsState[0];
  },

  async createProject(newProj: Omit<Project, 'id' | 'created_at' | 'reports_count' | 'activities_count' | 'matched_count' | 'review_count' | 'unmatched_count' | 'team_size'>): Promise<Project> {
    await delay(300);
    const created: Project = {
      ...newProj,
      id: `proj-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      reports_count: 0,
      activities_count: 0,
      matched_count: 0,
      review_count: 0,
      unmatched_count: 0,
      team_size: 1,
    };
    projectsState = [created, ...projectsState];
    saveState('projects', projectsState);
    return created;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    await delay(200);
    const idx = projectsState.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projectsState[idx] = { ...projectsState[idx], ...updates };
      saveState('projects', projectsState);
      return projectsState[idx];
    }
    return undefined;
  },

  // Schedule
  async getSchedule(_projectId?: string, discipline?: string): Promise<SchedulePlanItem[]> {
    await delay(150);
    return scheduleState.filter((item) => {
      const matchDiscipline = !discipline || discipline === 'all' || item.discipline === discipline;
      return matchDiscipline;
    });
  },

  async importSchedule(_projectId: string, items: SchedulePlanItem[]): Promise<SchedulePlanItem[]> {
    await delay(300);
    scheduleState = [...items, ...scheduleState];
    saveState('schedule', scheduleState);
    return scheduleState;
  },

  // Reports
  async getReports(_projectId?: string): Promise<ReportItem[]> {
    await delay(150);
    return [...reportsState];
  },

  async uploadReport(
    projectId: string,
    file: { name: string; size: string; type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt' },
    uploadedBy: string = 'Current User'
  ): Promise<ReportItem> {
    await delay(400);
    const newReport: ReportItem = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      project_id: projectId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: 'completed',
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      activities_count: 3,
      matched_count: 2,
      review_count: 1,
      unmatched_count: 0,
    };
    reportsState = [newReport, ...reportsState];
    saveState('reports', reportsState);

    // Also add an audit log
    await this.logAuditAction({
      action: 'extracted',
      confidence_score: 0.92,
      actor: uploadedBy,
      related_match_id: null,
      related_unmatched_id: null,
    });

    return newReport;
  },

  async updateReport(id: string, updates: Partial<ReportItem>): Promise<ReportItem | undefined> {
    await delay(150);
    const idx = reportsState.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reportsState[idx] = { ...reportsState[idx], ...updates };
      saveState('reports', reportsState);
      return reportsState[idx];
    }
    return undefined;
  },

  async archiveReport(id: string): Promise<boolean> {
    await delay(150);
    const initialLen = reportsState.length;
    reportsState = reportsState.filter((r) => r.id !== id);
    saveState('reports', reportsState);
    return reportsState.length < initialLen;
  },

  // Activities
  async getActivities(_projectId?: string): Promise<ExtractedActivity[]> {
    await delay(150);
    return [...activitiesState];
  },

  // Matches & Reconciliation
  async getMatches(_projectId?: string, statusFilter?: string, disciplineFilter?: string): Promise<ScheduleMatch[]> {
    await delay(150);
    return matchesState.filter((m) => {
      const matchesStatus = !statusFilter || statusFilter === 'all' || m.status === statusFilter;
      const disc = m.extracted_activity?.discipline || m.schedule_plan?.discipline;
      const matchesDiscipline = !disciplineFilter || disciplineFilter === 'all' || disc === disciplineFilter;
      return matchesStatus && matchesDiscipline;
    });
  },

  async getMatchById(id: string): Promise<ScheduleMatch | undefined> {
    await delay(100);
    return matchesState.find((m) => m.id === id);
  },

  async confirmMatch(matchId: string, actor: string = 'Shourya (Lead Planner)'): Promise<ScheduleMatch> {
    await delay(200);
    matchesState = matchesState.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'confirmed',
          resolved_by: actor,
        };
      }
      return m;
    });
    saveState('matches', matchesState);

    await this.logAuditAction({
      action: 'confirmed',
      confidence_score: 0.95,
      actor,
      related_match_id: matchId,
      related_unmatched_id: null,
    });

    const updated = matchesState.find((m) => m.id === matchId)!;
    return updated;
  },

  async rejectMatch(matchId: string, _reason?: string, actor: string = 'Shourya (Lead Planner)'): Promise<ScheduleMatch> {
    await delay(200);
    let target = matchesState.find((m) => m.id === matchId);
    matchesState = matchesState.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'rejected',
          resolved_by: actor,
        };
      }
      return m;
    });
    saveState('matches', matchesState);

    // If rejected, move to unmatched pool
    if (target && target.extracted_activity) {
      const newUnmatched: UnmatchedActivity = {
        id: `unmatched-${Date.now().toString().slice(-4)}`,
        extracted_activity_id: target.extracted_activity_id,
        best_score: target.confidence_score,
        resolution: 'unresolved',
        created_at: new Date().toISOString(),
        extracted_activity: target.extracted_activity,
      };
      unmatchedState = [newUnmatched, ...unmatchedState];
      saveState('unmatched', unmatchedState);
    }

    await this.logAuditAction({
      action: 'rejected',
      confidence_score: target?.confidence_score || null,
      actor,
      related_match_id: matchId,
      related_unmatched_id: null,
    });

    return matchesState.find((m) => m.id === matchId)!;
  },

  async reassignMatch(matchId: string, candidate: CandidateMatch, actor: string = 'Shourya (Lead Planner)'): Promise<ScheduleMatch> {
    await delay(200);
    const targetPlan = scheduleState.find((p) => p.id === candidate.plan_activity_id || p.activity_code === candidate.activity_code);

    matchesState = matchesState.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          plan_activity_id: candidate.plan_activity_id,
          confidence_score: candidate.score,
          status: 'confirmed',
          resolved_by: actor,
          schedule_plan: targetPlan || m.schedule_plan,
        };
      }
      return m;
    });
    saveState('matches', matchesState);

    await this.logAuditAction({
      action: 'manually_linked',
      confidence_score: candidate.score,
      actor,
      related_match_id: matchId,
      related_unmatched_id: null,
    });

    return matchesState.find((m) => m.id === matchId)!;
  },

  // Unmatched
  async getUnmatched(_projectId?: string): Promise<UnmatchedActivity[]> {
    await delay(150);
    return [...unmatchedState];
  },

  async resolveUnmatched(unmatchedId: string, targetPlanId: string, actor: string = 'Shourya (Lead Planner)'): Promise<void> {
    await delay(200);
    const unrec = unmatchedState.find((u) => u.id === unmatchedId);
    if (!unrec || !unrec.extracted_activity) return;

    const plan = scheduleState.find((p) => p.id === targetPlanId);
    const newMatch: ScheduleMatch = {
      id: `match-${Date.now().toString().slice(-4)}`,
      extracted_activity_id: unrec.extracted_activity_id,
      plan_activity_id: targetPlanId,
      confidence_score: 0.85,
      status: 'confirmed',
      resolved_by: actor,
      candidates: null,
      created_at: new Date().toISOString(),
      extracted_activity: unrec.extracted_activity,
      schedule_plan: plan,
    };
    matchesState = [newMatch, ...matchesState];
    unmatchedState = unmatchedState.filter((u) => u.id !== unmatchedId);

    saveState('matches', matchesState);
    saveState('unmatched', unmatchedState);

    await this.logAuditAction({
      action: 'manually_linked',
      confidence_score: 0.85,
      actor,
      related_match_id: newMatch.id,
      related_unmatched_id: unmatchedId,
    });
  },

  // Team
  async getTeam(_projectId?: string): Promise<TeamMember[]> {
    await delay(150);
    return [...teamState];
  },

  async inviteTeamMember(projectId: string, member: { name: string; email: string; role: 'planner' | 'supervisor' | 'manager' | 'engineer' }): Promise<TeamMember> {
    await delay(250);
    const created: TeamMember = {
      id: `team-${Date.now().toString().slice(-4)}`,
      project_id: projectId,
      name: member.name,
      email: member.email,
      role: member.role,
      status: 'invited',
      last_active: 'Invited just now',
    };
    teamState = [...teamState, created];
    saveState('team', teamState);
    return created;
  },

  async removeTeamMember(id: string): Promise<void> {
    await delay(200);
    teamState = teamState.filter((t) => t.id !== id);
    saveState('team', teamState);
  },

  // Audit
  async getAuditTrail(_projectId?: string): Promise<AuditTrailEntry[]> {
    await delay(150);
    return [...auditState];
  },

  async logAuditAction(entry: Omit<AuditTrailEntry, 'id' | 'created_at'>): Promise<AuditTrailEntry> {
    const created: AuditTrailEntry = {
      ...entry,
      id: `audit-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    auditState = [created, ...auditState];
    saveState('audit', auditState);
    return created;
  },

  // Analytics
  async getAnalytics(projectId: string = 'proj-01'): Promise<ProjectAnalytics> {
    await delay(150);
    return initialProjectAnalytics[projectId] || initialProjectAnalytics['proj-01'];
  },

  // Notifications
  async getNotifications(): Promise<ProjectNotification[]> {
    await delay(100);
    return [...notificationsState];
  },

  async markNotificationRead(id: string): Promise<void> {
    notificationsState = notificationsState.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveState('notifications', notificationsState);
  },

  async clearAllNotifications(): Promise<void> {
    notificationsState = notificationsState.map((n) => ({ ...n, read: true }));
    saveState('notifications', notificationsState);
  },

  // Field Updates Feed
  async getFieldUpdates(): Promise<FieldUpdateRecord[]> {
    await delay(100);
    return [...fieldUpdatesState];
  },

  async addFieldUpdate(record: Omit<FieldUpdateRecord, 'id'>): Promise<FieldUpdateRecord> {
    const created: FieldUpdateRecord = {
      ...record,
      id: `FR-${Date.now().toString().slice(-4)}`,
    };
    fieldUpdatesState = [created, ...fieldUpdatesState];
    saveState('field_updates', fieldUpdatesState);
    return created;
  },

  // Reset to initial mock data for demo
  resetMockData() {
    localStorage.removeItem('onground_projects');
    localStorage.removeItem('onground_schedule');
    localStorage.removeItem('onground_reports');
    localStorage.removeItem('onground_activities');
    localStorage.removeItem('onground_matches');
    localStorage.removeItem('onground_unmatched');
    localStorage.removeItem('onground_team');
    localStorage.removeItem('onground_audit');
    localStorage.removeItem('onground_notifications');
    localStorage.removeItem('onground_field_updates');
    projectsState = [...initialProjects];
    scheduleState = [...initialSchedulePlan];
    reportsState = [...initialReports];
    activitiesState = [...initialActivities];
    matchesState = [...initialMatches];
    unmatchedState = [...initialUnmatched];
    teamState = [...initialTeamMembers];
    auditState = [...initialAuditLogs];
    notificationsState = [...initialNotifications];
    fieldUpdatesState = [...initialFieldUpdates];
  },
};
