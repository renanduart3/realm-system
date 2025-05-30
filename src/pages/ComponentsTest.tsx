import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

export default function ComponentsTest() {
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  const testComponents = [
    {
      title: 'Buttons',
      content: (
        <div className="space-y-4">
          <div className="space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Primary Button
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Secondary Button
            </button>
            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Danger Button
            </button>
          </div>
          <div className="space-x-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Disabled Button
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading Button
              </div>
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Form Controls',
      content: (
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Input
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter text..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Input
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Checkbox
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Radio Button
            </label>
          </div>
        </div>
      )
    },
    {
      title: 'Cards',
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Basic Card
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This is a basic card component with some sample content.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Interactive Card
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This card has an interactive button.
            </p>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Click Me
            </button>
          </div>
        </div>
      )
    },
    {
      title: 'Alerts',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Info Alert: This is an informational message.
          </div>
          <div className="p-4 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Success Alert: Operation completed successfully.
          </div>
          <div className="p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            Warning Alert: Please review before proceeding.
          </div>
          <div className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Error Alert: Something went wrong.
          </div>
        </div>
      )
    },
    {
      title: 'Toast Messages',
      content: (
        <div className="space-x-2">
          <button
            onClick={() => showToast('Success message', 'success')}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Show Success Toast
          </button>
          <button
            onClick={() => showToast('Error message', 'error')}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Show Error Toast
          </button>
          <button
            onClick={() => showToast('Info message', 'info')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Show Info Toast
          </button>
          <button
            onClick={() => showToast('Warning message', 'warning')}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
          >
            Show Warning Toast
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Component Testing
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Toggle Dark Mode
        </button>
      </div>

      <div className="space-y-8">
        {testComponents.map((section, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {section.title}
            </h2>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
