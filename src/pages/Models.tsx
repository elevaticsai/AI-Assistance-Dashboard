import React, { useState } from 'react';
import { Settings, Zap } from 'lucide-react';

const models = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model, best for complex tasks',
    pricing: '$0.03/1K tokens',
    status: 'active',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most tasks',
    pricing: '$0.002/1K tokens',
    status: 'active',
  },
  {
    id: 'claude-2',
    name: 'Claude 2',
    description: 'Advanced reasoning and analysis',
    pricing: '$0.01/1K tokens',
    status: 'inactive',
  },
];

export default function Models() {
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure and manage AI models for your chatbot
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.id}
            className={`relative rounded-lg border p-6 ${
              selectedModel === model.id
                ? 'border-indigo-500 ring-2 ring-indigo-500'
                : 'border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {model.name}
                </h3>
                <div className="mt-1 flex items-center">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      model.status === 'active'
                        ? 'bg-green-400'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-500 capitalize">
                    {model.status}
                  </span>
                </div>
              </div>
              <Zap
                className={`h-6 w-6 ${
                  selectedModel === model.id
                    ? 'text-indigo-500'
                    : 'text-gray-400'
                }`}
              />
            </div>

            <p className="mt-4 text-sm text-gray-500">{model.description}</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {model.pricing}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedModel(model.id)}
                className={`text-sm font-medium ${
                  selectedModel === model.id
                    ? 'text-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                {selectedModel === model.id ? 'Selected' : 'Select'}
              </button>
              <button className="text-gray-400 hover:text-gray-500">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Model Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="temperature"
              className="block text-sm font-medium text-gray-700"
            >
              Temperature
            </label>
            <input
              type="range"
              id="temperature"
              min="0"
              max="2"
              step="0.1"
              defaultValue="0.7"
              className="mt-1 w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>More Focused</span>
              <span>More Creative</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="max-tokens"
              className="block text-sm font-medium text-gray-700"
            >
              Maximum Length (tokens)
            </label>
            <input
              type="number"
              id="max-tokens"
              defaultValue="2048"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}