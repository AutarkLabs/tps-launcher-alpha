import memoize from 'lodash.memoize'
import { addressesEqual } from './web3-utils'

// Note that these two terms are slightly confusing artifacts of the ACL:
//   Any entity: If a permission is granted to "any entity", then any address can be seen as holding
//               that permission
//   Burn entity: If a permission manager is set as "burn entity", then it is assumed to be a
//               discarded and frozen permission
const ANY_ENTITY = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
const BURN_ENTITY = '0x0000000000000000000000000000000000000001'
const KERNEL_ROLES = [
  {
    name: 'Manage apps',
    id: 'APP_MANAGER_ROLE',
    params: [],
    bytes: '0xb6d92708f3d4817afc106147d969e229ced5c46e65e0a5002a0d391287762bd0',
  },
]

export function getAnyEntity() {
  return ANY_ENTITY
}

export function getBurnEntity() {
  return BURN_ENTITY
}

// Check if the address represents “Any address”
export function isAnyEntity(address) {
  return addressesEqual(address, ANY_ENTITY)
}

// Check if the address represents the “Burned address”
export function isBurnEntity(address) {
  return addressesEqual(address, BURN_ENTITY)
}

// Get a role from the known roles (kernel)
export const getKnownRole = roleBytes => {
  for (const role of KERNEL_ROLES) {
    if (roleBytes === role.bytes) {
      return { appName: 'Kernel', role }
    }
  }
  return null
}

// Get a list of roles assigned to entities.
// Input:  app instances => roles => entities
// Output: entities => app instances => roles
export function permissionsByEntity(permissions) {
  const results = {}

  const addRole = (entity, app, role) => {
    entity = entity.toLowerCase()
    if (!results[entity]) {
      results[entity] = {}
    }
    results[entity][app] = [...(results[entity][app] || []), role]
  }

  // apps
  for (const [app, appPermissions] of Object.entries(permissions)) {
    // roles
    for (const [role, { allowedEntities = [] }] of Object.entries(
      appPermissions
    )) {
      // entities
      for (const entity of allowedEntities) {
        addRole(entity, app, role)
      }
    }
  }

  return results
}

// Get the roles attached to an entity.
export const entityRoles = (
  entityAddress,
  permissionsByEntity,
  transform = (role, proxyAddress) => role
) =>
  permissionsByEntity[entityAddress]
    ? Object.entries(permissionsByEntity[entityAddress]).reduce(
        (roles, [proxyAddress, appRoles]) =>
          roles.concat(appRoles.map(role => transform(role, proxyAddress))),
        []
      )
    : null

// Get the permissions declared on an app.
export const appPermissions = (
  app,
  permissions,
  transform = (entity, role) => [entity, role]
) => {
  const roles = permissions[app.proxyAddress]
  const rolesReducer = (roles, [role, { allowedEntities = [] }]) =>
    roles.concat(allowedEntities.map(entity => transform(entity, role)))

  return roles
    ? Object.entries(roles)
        .reduce(rolesReducer, [])
        .filter(Boolean)
    : []
}

// Get the roles of an app.
export const appRoles = (app, permissions) => {
  const roles = permissions[app.proxyAddress]
  return roles
    ? Object.entries(roles).map(
        ([roleBytes, { allowedEntities, manager }]) => ({
          roleBytes,
          allowedEntities,
          manager,
        })
      )
    : []
}

// Resolves a role using the provided apps
function resolveRole(apps, proxyAddress, roleBytes) {
  const knownRole = getKnownRole(roleBytes)
  if (knownRole) {
    return knownRole.role
  }
  const app = apps.find(app => addressesEqual(app.proxyAddress, proxyAddress))
  if (!app || !app.roles) {
    return null
  }
  return app.roles.find(role => role.bytes === roleBytes)
}

// Resolves an entity using the provided apps
function resolveEntity(apps, address) {
  const entity = { address, type: 'address' }
  if (isAnyEntity(address)) {
    return { ...entity, type: 'any' }
  }
  if (isBurnEntity(address)) {
    return { ...entity, type: 'burn' }
  }
  const app = apps.find(app => addressesEqual(app.proxyAddress, address))
  return app ? { ...entity, app, type: 'app' } : entity
}

// Returns a function that resolves an entity, caching the results
export function entityResolver(apps = []) {
  return memoize(address => resolveEntity(apps, address))
}

// Returns a function that resolves an role, caching the results
export function roleResolver(apps = []) {
  return memoize(
    (proxyAddress, roleBytes) => resolveRole(apps, proxyAddress, roleBytes),
    (proxyAddress, roleBytes) => proxyAddress + roleBytes
  )
}
