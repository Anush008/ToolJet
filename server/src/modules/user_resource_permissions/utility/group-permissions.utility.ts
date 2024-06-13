import { Brackets, EntityManager, SelectQueryBuilder } from 'typeorm';
import { USER_ROLE, GROUP_PERMISSIONS_TYPE } from '../constants/group-permissions.constant';
import { User } from 'src/entities/user.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { CreateGroupPermissionDto, UpdateGroupPermissionDto } from '@dto/group_permissions.dto';
import { ERROR_HANDLER } from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupUsers } from 'src/entities/group_users.entity';

export function getRoleUsersListQuery(
  role: USER_ROLE,
  organizationId: string,
  manager: EntityManager,
  groupPermissionId?: string
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'user')
    .innerJoinAndSelect('user.userGroups', 'userGroups')
    .innerJoin('userGroups.group', 'group', 'group.organizationId = :organizationId', { organizationId })
    .andWhere('group.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
    .andWhere('group.name = :name', { name: role });

  if (groupPermissionId) {
    query.andWhere(
      'user.id IN ' +
        query
          .subQuery()
          .select('user.id')
          .from(User, 'user')
          .innerJoin('user.userGroups', 'subUserGroup')
          .where('subUserGroup.groupId = :groupId', { groupId: groupPermissionId })
          .getQuery()
    );
  }
  query.select([
    'user.id',
    'user.firstName',
    'user.lastName',
    'user.email',
    'userGroups.groupId',
    'group.name',
    'group.type',
  ]);

  return query;
}

export function getUserDetailQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'user')
    .innerJoin('user.organizationUsers', 'organizationUsers', 'organizationUsers.organizationId = :organizationId', {
      organizationId,
    })
    .where('user.id = :userId', {
      userId,
    });

  return query;
}

export function getUserRoleQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<GroupPermissions> {
  const query = manager
    .createQueryBuilder(GroupPermissions, 'role')
    .innerJoinAndSelect('role.groupUsers', 'groupUsers', 'groupUsers.userId = :userId', { userId })
    .where('role.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
    .andWhere('role.organizationId = :organizationId', { organizationId });

  return query;
}

export function validateUpdateGroupOperation(
  group: GroupPermissions,
  updateGroupPermissionDto: UpdateGroupPermissionDto
): void {
  const { name } = group;
  const { name: newName } = updateGroupPermissionDto;

  if (
    newName &&
    (Object.values(USER_ROLE).includes(newName as USER_ROLE) || group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
  ) {
    throw new MethodNotAllowedException(ERROR_HANDLER.DEFAULT_GROUP_NAME_UPDATE);
  }

  if ([USER_ROLE.ADMIN, USER_ROLE.END_USER].includes(name as USER_ROLE)) {
    console.log('this is running');

    throw new MethodNotAllowedException(ERROR_HANDLER.NON_EDITABLE_GROUP_UPDATE);
  }
}

export function validateDeleteGroupUserOperation(group: GroupPermissions) {
  if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);

  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.DELETING_DEFAULT_GROUP_USER);
}

export function validateAddGroupUserOperation(group: GroupPermissions) {
  if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
  if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    throw new MethodNotAllowedException(ERROR_HANDLER.ADD_GROUP_USER_DEFAULT_GROUP);
}

export function getAllUserGroupsQuery(
  userId: string,
  organizationId: string,
  manager: EntityManager
): SelectQueryBuilder<GroupPermissions> {
  const query = manager
    .createQueryBuilder(GroupPermissions, 'groups')
    .innerJoinAndSelect('groups.groupUsers', 'groupUsers', 'groups.organizationId = :organizationId', {
      organizationId,
    })
    .where('groupUsers.userId = :userId', {
      userId,
    })
    .andWhere('groups.type = :type', {
      type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
    });
  return query;
}

export function validateCreateGroupOperation(createGroupPermissionDto: CreateGroupPermissionDto) {
  if (createGroupPermissionDto.name in USER_ROLE) throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
}

export function addableUsersToGroupQuery(
  groupId: string,
  organizationId: string,
  manager: EntityManager,
  searchInput?: string
): SelectQueryBuilder<User> {
  const query = manager
    .createQueryBuilder(User, 'users')
    .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.organizationId = :organizationId', {
      organizationId: organizationId,
    })
    .where((qb) => {
      const subQuery = qb
        .subQuery()
        .select('groupUsers.userId')
        .from(GroupUsers, 'groupUsers')
        .innerJoin('groupUsers.group', 'group')
        .where('(group.name = :admin OR group.id = :groupId)', { admin: USER_ROLE.ADMIN, groupId })
        .andWhere('group.organizationId = :organizationId', { organizationId })
        .getQuery();

      return 'users.id NOT IN ' + subQuery;
    })
    .andWhere(addableUserGetOrConditions(searchInput));

  return query;
}

const addableUserGetOrConditions = (searchInput) => {
  return new Brackets((qb) => {
    if (searchInput) {
      qb.orWhere('lower(users.email) like :email', {
        email: `%${searchInput.toLowerCase()}%`,
      });
      qb.orWhere('lower(users.firstName) like :firstName', {
        firstName: `%${searchInput.toLowerCase()}%`,
      });
      qb.orWhere('lower(users.lastName) like :lastName', {
        lastName: `%${searchInput.toLowerCase()}%`,
      });
    }
  });
};

export function getUserInGroupQuery(
  groupId: string,
  manager: EntityManager,
  searchInput: string
): SelectQueryBuilder<GroupUsers> {
  const query = manager
    .createQueryBuilder(GroupUsers, 'groupUsers')
    .innerJoinAndSelect('groupUsers.user', 'users', 'groupUsers.groupId = :groupId', { groupId })
    .select(['groupUsers.id', 'groupUsers.groupId', 'users.id', 'users.firstName', 'users.lastName', 'users.email'])
    .andWhere(addableUserGetOrConditions(searchInput));
  return query;
}
