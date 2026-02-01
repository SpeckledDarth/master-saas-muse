export type TeamRole = 'owner' | 'manager' | 'member' | 'viewer'

export interface TeamPermissions {
  canManageTeam: boolean
  canInviteMembers: boolean
  canManageUsers: boolean
  canEditContent: boolean
  canPublishContent: boolean
  canViewAnalytics: boolean
  canAccessBilling: boolean
  canEditSettings: boolean
  canViewTeamList: boolean
}

export function getTeamPermissions(role: TeamRole): TeamPermissions {
  switch (role) {
    case 'owner':
      return {
        canManageTeam: true,
        canInviteMembers: true,
        canManageUsers: true,
        canEditContent: true,
        canPublishContent: true,
        canViewAnalytics: true,
        canAccessBilling: true,
        canEditSettings: true,
        canViewTeamList: true,
      }
    case 'manager':
      return {
        canManageTeam: false,
        canInviteMembers: true,
        canManageUsers: true,
        canEditContent: true,
        canPublishContent: true,
        canViewAnalytics: true,
        canAccessBilling: false,
        canEditSettings: false,
        canViewTeamList: true,
      }
    case 'member':
      return {
        canManageTeam: false,
        canInviteMembers: false,
        canManageUsers: false,
        canEditContent: true,
        canPublishContent: false,
        canViewAnalytics: true,
        canAccessBilling: false,
        canEditSettings: false,
        canViewTeamList: true,
      }
    case 'viewer':
      return {
        canManageTeam: false,
        canInviteMembers: false,
        canManageUsers: false,
        canEditContent: false,
        canPublishContent: false,
        canViewAnalytics: false,
        canAccessBilling: false,
        canEditSettings: false,
        canViewTeamList: false,
      }
    default:
      return {
        canManageTeam: false,
        canInviteMembers: false,
        canManageUsers: false,
        canEditContent: false,
        canPublishContent: false,
        canViewAnalytics: false,
        canAccessBilling: false,
        canEditSettings: false,
        canViewTeamList: false,
      }
  }
}

export function canPerformAction(role: TeamRole, action: keyof TeamPermissions): boolean {
  const permissions = getTeamPermissions(role)
  return permissions[action]
}
