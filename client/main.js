import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import Sortable from 'sortablejs';
import confetti from 'canvas-confetti'; 
import { TasksCollection } from '../imports/api/TasksCollection';

import './main.html';

// 1. Initialization & State Management
Template.mainContainer.onCreated(function () {
  this.subscribe('tasks');
  // Track current filter: 'all', 'active', or 'completed'
  this.filter = new ReactiveVar('all');
});

// 2. Persistent Drag-and-Drop Logic
Template.mainContainer.onRendered(function () {
  this.autorun(() => {
    // We need to re-sync Sortable whenever the filtered list changes
    const filter = this.filter.get(); 
    
    Tracker.afterFlush(() => {
      const el = document.getElementById('tasks');
      if (!el) return;

      // Destroy existing instance to prevent duplication or memory leaks
      if (el.sortableInstance) {
        el.sortableInstance.destroy();
      }

      // Initialize SortableJS
      el.sortableInstance = Sortable.create(el, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        // Important: Drag-and-drop only enabled in "All" view to maintain order integrity
        disabled: filter !== 'all', 
        onEnd() {
          const items = el.querySelectorAll('li');
          items.forEach((item, index) => {
            // Updates the 'order' field in MongoDB for persistence
            Meteor.call('tasks.reorder', item.dataset.id, index);
          });
        }
      });
    });
  });
});

// 3. Template Helpers
Template.mainContainer.helpers({
  tasks() {
    const instance = Template.instance();
    const filter = instance.filter.get();
    
    let query = {};

    if (filter === 'active') {
      query = { checked: { $ne: true } };
    } else if (filter === 'completed') {
      query = { checked: true };
    }

    // Always sort by 'order' so drag-and-drop state is visually consistent
    return TasksCollection.find(query, { sort: { order: 1 } });
  },

  hasTasks() {
    return TasksCollection.find().count() > 0;
  },

  incompleteCount() {
    return TasksCollection.find({ checked: { $ne: true } }).count();
  },

  // Highlight the active filter button
  activeFilterClass(filterName) {
    return Template.instance().filter.get() === filterName ? 'active' : '';
  },

  // Logic for the Empty State Message (Crucial for UX)
  emptyStateMessage() {
    const instance = Template.instance();
    const filter = instance.filter.get();
    const totalCount = TasksCollection.find().count();

    // If there are absolutely no tasks in the database
    if (totalCount === 0) {
      return "No tasks available. Add one above.";
    }
    
    // If filtering to 'active' but all are completed
    if (filter === 'active') {
      return "You're all caught up! No pending tasks.";
    }
    
    // If filtering to 'completed' but none are finished
    if (filter === 'completed') {
      return "You haven't finished any tasks yet.";
    }
    
    return "No tasks found.";
  }
});

// 4. Main Container Events
Template.mainContainer.events({
  'submit .new-task'(event) {
    event.preventDefault();
    const target = event.target;

    Meteor.call(
      'tasks.insert',
      target.text.value,
      target.category.value
    );

    target.text.value = '';
  },

  // Filter button logic: Updates the ReactiveVar to trigger the tasks() helper
  'click .filter-btn'(event, instance) {
    const filterValue = event.currentTarget.getAttribute('data-filter');
    instance.filter.set(filterValue);
  }
});

// 5. Individual Task Item Events
Template.taskItem.events({
  'click .delete-task'() {
    Meteor.call('tasks.remove', this._id);
  },

  'change .toggle-checked'(event) {
    const isChecked = event.target.checked;
    
    // Update the task status
    Meteor.call('tasks.setIsChecked', this._id, isChecked, (error) => {
      if (!error && isChecked) {
        // CELEBRATION LOGIC: Check if this was the final task
        const remainingActive = TasksCollection.find({ checked: { $ne: true } }).count();
        
        if (remainingActive === 0) {
          // Fire the "Blast" 
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899'] 
          });
        }
      }
    });
  }
});