// Tipos y helpers puros (sin 'server-only') compartidos entre server y client.

export interface TeacherInviteRow {
  id: string;
  token: string;
  email_hint: string | null;
  expires_at: string;
  used: boolean;
  revoked: boolean;
  created_at: string;
  created_by: string;
}

export interface StudentInviteRow {
  id: string;
  token: string;
  course_id: string;
  course_name: string | null;
  expires_at: string;
  used: boolean;
  revoked: boolean;
  created_at: string;
  created_by: string;
}

export type InviteStatus = 'active' | 'expired' | 'used' | 'revoked';

export function inviteStatus(row: {
  used: boolean;
  revoked: boolean;
  expires_at: string;
}): InviteStatus {
  if (row.revoked) return 'revoked';
  if (row.used) return 'used';
  if (new Date(row.expires_at).getTime() < Date.now()) return 'expired';
  return 'active';
}

export interface InvitePreview {
  kind: 'teacher' | 'student';
  institutionId: string;
  institutionName: string | null;
  courseId: string | null;
  courseName: string | null;
  status: InviteStatus;
  expires_at: string;
}
