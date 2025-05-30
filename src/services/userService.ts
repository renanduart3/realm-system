import { db } from '../db/AppDatabase';
import { SystemUser, InvitationCode } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const getUserByUsername = async (username: string): Promise<SystemUser | null> => {
  try {
    const user = await db.systemUsers
      .where('username')
      .equals(username)
      .first();
    return user || null;
  } catch (error) {
    console.error("Error getting user by username", error);
    return null;
  }
};

export const userService = {
  getUserByUsername,
  
  async createUser(
    username: string,
    password: string,
    role: 'master' | 'seller',
    nature_type: 'profit' | 'nonprofit'
  ): Promise<SystemUser | null> {
    try {
      const user: SystemUser = {
        id: uuidv4(),
        username,
        password,
        role,
        nature_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await db.systemUsers.add(user);
      return user;
    } catch (error) {
      console.error("Error creating user", error);
      return null;
    }
  },

  async getInvitationCode(code: string): Promise<InvitationCode | null> {
    try {
      const invitationCode = await db.invitationCodes
        .where('code')
        .equals(code)
        .first();
      return invitationCode || null;
    } catch (error) {
      console.error("Error getting invitation code", error);
      return null;
    }
  }
};

const getSystemUserById = async (id: string): Promise<SystemUser | null> => {
  try {
    const user = await db.systemUsers.get(id);
    return user || null;
  } catch (error) {
    console.error("Error getting user by id", error);
    return null;
  }
};

const createInvitationCode = async (user_gerente_id: string): Promise<InvitationCode | null> => {
  try {
    const newInvitationCode: InvitationCode = {
      id: uuidv4(),
      code: uuidv4(),
      user_gerente_id,
      created_at: new Date().toISOString()
    };

    await db.invitationCodes.add(newInvitationCode);
    return newInvitationCode;
  } catch (error) {
    console.error("Error creating invitation code", error);
    return null;
  }
};

const getInvitationCodeByCode = async (code: string): Promise<InvitationCode | null> => {
  try {
    const invitationCode = await db.invitationCodes
      .where('code')
      .equals(code)
      .first();
    return invitationCode || null;
  } catch (error) {
    console.error("Error getting invitation code", error);
    return null;
  }
};