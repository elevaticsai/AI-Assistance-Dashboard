import React from 'react';
import { Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your chatbot and application settings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="bot-name"
                className="block text-sm font-medium text-gray-700"
              >
                Chatbot Name
              </label>
              <input
                type="text"
                id="bot-name"
                defaultValue="AI Assistant"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700"
              >
                Default Language
              </label>
              <select
                id="language"
                defaultValue="en"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700"
              >
                Timezone
              </label>
              <select
                id="timezone"
                defaultValue="UTC"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">GMT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">API Settings</h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-gray-700"
              >
                API Key
              </label>
              <input
                type="password"
                id="api-key"
                placeholder="Enter your API key"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="requests-per-minute"
                className="block text-sm font-medium text-gray-700"
              >
                Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                id="requests-per-minute"
                defaultValue="60"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="timeout"
                className="block text-sm font-medium text-gray-700"
              >
                Request Timeout (seconds)
              </label>
              <input
                type="number"
                id="timeout"
                defaultValue="30"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">
            Notification Settings
          </h3>
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <input
                id="email-notifications"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="email-notifications"
                className="ml-3 text-sm text-gray-700"
              >
                Email Notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="error-alerts"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="error-alerts"
                className="ml-3 text-sm text-gray-700"
              >
                Error Alerts
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="usage-reports"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="usage-reports"
                className="ml-3 text-sm text-gray-700"
              >
                Weekly Usage Reports
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}