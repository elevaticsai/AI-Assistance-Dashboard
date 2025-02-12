import React from 'react';

interface InteractiveOptionsProps {
  question: string;
  options: string[];
  onOptionSelect: (option: string) => void;
}

const InteractiveOptions = ({ question, options, onOptionSelect } : InteractiveOptionsProps) => {
  return (
    <div className="w-full bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-gray-800 font-medium mb-3">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onOptionSelect(option)}
            className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm">
                {index + 1}
              </span>
              <span>{option}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
  
export default InteractiveOptions;