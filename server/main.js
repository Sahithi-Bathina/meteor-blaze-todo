import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../imports/api/TasksCollection';

Meteor.startup(async () => {
  // Seed data if database is empty
  if (await TasksCollection.find().countAsync() === 0) {
    await TasksCollection.insertAsync({
      text: 'Complete Meteor Assessment',
      category: 'Placement',
      createdAt: new Date(),
      checked: false,
      order: 0
    });
  }
});

Meteor.methods({
  // Insert a new task with a timestamp-based order
  async 'tasks.insert'(text, category) {
    if (!text) {
      throw new Meteor.Error(
        'text-required',
        'Task text cannot be empty'
      );
    }

    return await TasksCollection.insertAsync({
      text,
      category,
      createdAt: new Date(),
      checked: false,
      order: Date.now()
    });
  },

  // Remove a task by ID
  async 'tasks.remove'(taskId) {
    return await TasksCollection.removeAsync(taskId);
  },

  // Updated method name to 'tasks.setIsChecked' to match client.js
  async 'tasks.setIsChecked'(taskId, checked) {
    return await TasksCollection.updateAsync(
      taskId,
      {
        $set: {
          checked
        }
      }
    );
  },

  // Update the order index for drag-and-drop persistence
  async 'tasks.reorder'(taskId, newOrder) {
    return await TasksCollection.updateAsync(
      taskId,
      {
        $set: {
          order: newOrder
        }
      }
    );
  }
});

// Publish tasks so the client can subscribe to them
Meteor.publish('tasks', function () {
  return TasksCollection.find();
});