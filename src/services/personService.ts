import { db } from '../db/AppDatabase';
import { Person } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const personService = {
  async createPerson(
    name: string,
    email: string,
    phone: string,
    document: string,
    address?: string,
    socialPrograms?: string[],
    familyIncome?: number
  ): Promise<Person | null> {
    try {
      const newPerson: Person = {
        id: uuidv4(),
        name,
        email,
        phone,
        document,
        address,
        socialPrograms,
        familyIncome,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.persons.add(newPerson);
      return newPerson;
    } catch (error) {
      console.error("Error creating new person", error);
      return null;
    }
  },

  async getPersonById(id: string): Promise<Person | null> {
    try {
      const person = await db.persons.get(id);
      return person || null;
    } catch (error) {
      console.error("Error getting person", error);
      return null;
    }
  },

  async getAllPersons(): Promise<Person[]> {
    try {
      const persons = await db.persons.toArray();
      return persons;
    } catch (error) {
      console.error("Error getting all persons", error);
      return [];
    }
  },

  async editPerson(person: Person): Promise<Person | null> {
    try {
      const updatedPerson = {
        ...person,
        updated_at: new Date().toISOString()
      };
      
      await db.persons.put(updatedPerson);
      return updatedPerson;
    } catch (error) {
      console.error("Error editing person", error);
      return null;
    }
  },

  async deletePerson(id: string): Promise<boolean> {
    try {
      await db.persons.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting person", error);
      return false;
    }
  }
}; 