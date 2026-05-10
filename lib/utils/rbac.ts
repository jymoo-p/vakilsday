import { Role } from '@prisma/client'

export const PERMISSIONS = {
  CASES: {
    VIEW_ALL: [Role.ADMIN],
    VIEW_ASSIGNED: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    CREATE: [Role.ADMIN, Role.ASSOCIATE],
    UPDATE: [Role.ADMIN, Role.ASSOCIATE],
    DELETE: [Role.ADMIN],
    UPDATE_HEARING_DATE: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
  },
  DOCUMENTS: {
    VIEW: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    UPLOAD: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    DELETE: [Role.ADMIN, Role.ASSOCIATE],
  },
  NOTES: {
    VIEW_PRIVATE: [Role.ADMIN, Role.ASSOCIATE],
    CREATE_PRIVATE: [Role.ADMIN, Role.ASSOCIATE],
    CREATE_PUBLIC: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    UPDATE_OWN: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    DELETE_OWN: [Role.ADMIN, Role.ASSOCIATE, Role.CLERK],
    DELETE_ANY: [Role.ADMIN],
  },
  RESEARCH: {
    VIEW: [Role.ADMIN, Role.ASSOCIATE],
    CREATE: [Role.ADMIN, Role.ASSOCIATE],
    DELETE_OWN: [Role.ADMIN, Role.ASSOCIATE],
  },
  USERS: {
    MANAGE: [Role.ADMIN],
  },
}

export function hasPermission(userRole: Role, permittedRoles: Role[]): boolean {
  return permittedRoles.includes(userRole)
}

export function canViewAllCases(userRole: Role): boolean {
  return hasPermission(userRole, PERMISSIONS.CASES.VIEW_ALL)
}

export function canUpdateHearingDate(userRole: Role): boolean {
  return hasPermission(userRole, PERMISSIONS.CASES.UPDATE_HEARING_DATE)
}

export function canViewPrivateNotes(userRole: Role): boolean {
  return hasPermission(userRole, PERMISSIONS.NOTES.VIEW_PRIVATE)
}

export function canManageUsers(userRole: Role): boolean {
  return hasPermission(userRole, PERMISSIONS.USERS.MANAGE)
}
