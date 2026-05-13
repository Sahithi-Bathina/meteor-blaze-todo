import { Mongo } from 'meteor/mongo';

/**
 * TasksCollection stores the application's todo items.
 * Fields: 
 * - text (String)
 * - category (String)
 * - createdAt (Date)
 * - checked (Boolean)
 * - order (Number) - Used for persistent drag-and-drop sorting
 */
export const TasksCollection = new Mongo.Collection('tasks');