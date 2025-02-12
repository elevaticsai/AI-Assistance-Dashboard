import React, { memo, useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { Mic, Send, RotateCcw, StopCircle, Play, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import VideoPreview from './VideoPreview';
import InteractiveOptions from './InteractiveOptions';
import LinkComponent from './LinkComponent';
import AudioControls from './AudioControls';

const components = {
    a: LinkComponent
  };

interface Message {
  type: 'user' | 'bot';
  content: string;
  audio?: string;
  audioElement?: HTMLAudioElement;
  isPlaying?: boolean;
}

interface EventData {
  type: string;
  content?: string;
  response_full?: {
    clarification?: Clarification[];
  };
}

interface Clarification {
  question: string;
  options: string[];
}

const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'gu-IN', label: 'ગુજરાતી' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ' },
  { value: 'ml-IN', label: 'മലയാളം' },
  { value: 'mr-IN', label: 'मराठी' },
  { value: 'ta-IN', label: 'தமிழ் (இந்தியா)' },
  { value: 'te-IN', label: 'తెలుగు' },
  { value: 'ur-IN', label: 'اُردُو (بھارت)' },
];

const MODEL_OPTIONS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'meta-llama/llama-3.2-90b-vision-instruct', label: 'Llama 3.2 90B (Vision)' },
  { value: 'meta-llama/llama-3.2-11b-vision-instruct', label: 'Llama 3.2 11B (Vision)' },
  { value: 'meta-llama/llama-3.2-3b-instruct', label: 'Llama 3.2 3B' },
  { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { value: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B' },
  { value: 'meta-llama/llama-3-8b-instruct', label: 'Llama 3 8B' },
  { value: 'mistralai/mixtral-8x7b-instruct', label: 'Mixtral 8x7B' },
  { value: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B' },
];

const ChatUI = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marked.setOptions({
      //@ts-ignore
      highlight: (code: any, lang: any) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      gfm: true,
      breaks: false,
      pedantic: false,
      headerIds: false,
      mangle: false,
    });
    resetConversation();

    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetConversation = () => {
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setMessages([{ type: 'bot', content: 'How can I help you with DigiYatra?' }]);
    setUserInput('');
    setIsScrollingUp(false);
    setLastScrollTop(0);
    
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = 0;
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const st = event.currentTarget.scrollTop;
    setIsScrollingUp(st < lastScrollTop);
    setLastScrollTop(st <= 0 ? 0 : st);
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    setIsRecording(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = selectedLanguage;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsRecording(false);
      sendMessage(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      if (isRecording) {
        setIsRecording(false);
      }
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSendButton = () => {
    if (isRecording) {
      stopRecording();
    } else if (!userInput.trim()) {
      startRecording();
    } else {
      sendMessage(userInput);
    }
  };

// First, update the Message interface to handle multiple clarifications
interface Message {
    type: 'user' | 'bot';
    content: string;
    audio?: string;
    audioElement?: HTMLAudioElement;
    isPlaying?: boolean;
    clarifications?: Array<{
      question: string;
      options: string[];
    }>;
  }
  
  const parseInteractContent = (content: string) => {
    const clarifications = [];
    const regex = /- text: (.*?)\n\s*options:((?:\s*-[^\n]*\n)*)/g;
    let match;
  
    while ((match = regex.exec(content)) !== null) {
      const question = match[1].trim();
      const optionsText = match[2];
      const options = optionsText
        .split('\n')
        .map(opt => opt.trim())
        .filter(opt => opt.startsWith('-'))
        .map(opt => opt.substring(1).trim())
        .filter(Boolean);
  
      if (question && options.length > 0) {
        clarifications.push({ question, options });
      }
    }
  
    return clarifications;
  };
  
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    setMessages(prev => [...prev, { type: 'user', content: marked.parse(message) }]);
    setUserInput('');
    
    try {
      const response = await fetch('https://pvanand-rag-chat-with-analytics.hf.space/digiyatra-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '44d5c2ac18ced6fc25c1e57dcd06fc0b31fb4ad97bf56e67540671a647465df4',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          query: message,
          model_id: selectedModel,
          conversation_id: conversationId,
          user_id: 'string',
          table_id: 'digiyatra'
        })
      });
  
      const reader = response.body?.getReader();
      if (!reader) return;
  
      let currentResponse = '';
      let currentClarifications: any[] = [];
      let interactContent = '';
      let isCollectingInteract = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const eventData = JSON.parse(line.substring(6)) as EventData;
            
            if (eventData.type === 'token') {
              const content = eventData.content as any;
  
              // Handle interact tags
              if (content.includes('<interact>')) {
                isCollectingInteract = true;
                continue;
              }
              
              if (content.includes('</interact>')) {
                isCollectingInteract = false;
                // Parse all questions and options from interact content
                const parsedClarifications = parseInteractContent(interactContent);
                if (parsedClarifications.length > 0) {
                  currentClarifications = parsedClarifications;
                }
                interactContent = '';
                continue;
              }
  
              if (isCollectingInteract) {
                interactContent += content;
              } else {
                // Only add non-interact content
                currentResponse += content;
              }
  
              // Clean the response content
              const cleanContent = currentResponse
                // Remove any remaining interact tags and their content
                .replace(/<interact>[\s\S]*?<\/interact>/g, '')
                // Remove questions and options text if they somehow appear
                .replace(/questions:\s*-\s*text:.*?(?=<|$)/gs, '')
                .replace(/options:\s*(?:-.*\n*)*?(?=<|$)/g, '')
                // Clean up any remaining artifacts
                .replace(/^\s*[\r\n]/gm, '')
                .trim();
  
              // Update messages with clean content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.type === 'bot') {
                  lastMessage.content = marked.parse(cleanContent);
                  if (currentClarifications.length > 0) {
                    lastMessage.clarifications = currentClarifications;
                  }
                } else {
                  newMessages.push({ 
                    type: 'bot', 
                    content: marked.parse(cleanContent),
                    clarifications: currentClarifications.length > 0 ? currentClarifications : undefined
                  });
                }
                return newMessages;
              });
            } else if (eventData.type === 'metadata' && eventData.response_full?.clarification) {
              // Backup: If interact parsing fails, use metadata
              if (currentClarifications.length === 0) {
                currentClarifications = eventData.response_full.clarification;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.type === 'bot') {
                    lastMessage.clarifications = currentClarifications;
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'An error occurred while processing your request.' 
      }]);
    }
    
    scrollToBottom();
  };

  const toggleAudio = (index: number) => {
    const message = messages[index];
    if (!message.audio) return;

    if (currentAudio && currentAudio !== message.audioElement) {
      currentAudio.pause();
      setMessages(prev => prev.map(m => ({
        ...m,
        isPlaying: m.audioElement === currentAudio ? false : m.isPlaying
      })));
    }

    if (!message.audioElement) {
      const audio = new Audio(message.audio);
      audio.addEventListener('ended', () => {
        setMessages(prev => prev.map((m, i) => 
          i === index ? { ...m, isPlaying: false } : m
        ));
      });
      message.audioElement = audio;
    }

    if (message.isPlaying) {
      message.audioElement.pause();
    } else {
      message.audioElement.play();
      setCurrentAudio(message.audioElement);
    }

    setMessages(prev => prev.map((m, i) => 
      i === index ? { ...m, isPlaying: !m.isPlaying } : m
    ));
  };

// Function to extract text content from message
const getMessageTextContent = (message: any) => {
    let text = '';
    
    // Add main message content (strip HTML tags)
    text += message.content.replace(/<[^>]*>/g, '') + ' ';
    
    // Add questions and options if present
    if (message.clarifications) {
      message.clarifications.forEach((clarification: any) => {
        text += clarification.question + ' Options are: ';
        clarification.options.forEach((option: any, index:any) => {
          text += `${option}${index < clarification.options.length - 1 ? ', ' : '. '}`;
        });
      });
    }
    
    return text;
  };

// Remove the absolute positioned dropdowns and add them to the header
return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="h-[98vh] flex flex-col bg-gray-50 rounded-lg shadow-lg overflow-hidden">
        {/* Header with title and options */}
        <div className="bg-blue-600 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">DigiYatra Assistant</h1>
            <div className="flex gap-3">
              {/* Model Selection */}
              <div ref={modelDropdownRef} className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  <span className="truncate max-w-[150px]">
                    {MODEL_OPTIONS.find(option => option.value === selectedModel)?.label || 'Select model'}
                  </span>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {isModelDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {MODEL_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => {
                          setSelectedModel(option.value);
                          setIsModelDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
  
              {/* Language Selection */}
              <div ref={languageDropdownRef} className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  <span className="truncate max-w-[150px]">
                    {LANGUAGE_OPTIONS.find(option => option.value === selectedLanguage)?.label || 'Select language'}
                  </span>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {LANGUAGE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => {
                          setSelectedLanguage(option.value);
                          setIsLanguageDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  
        {/* Messages Container */}
        <div className="flex-grow overflow-hidden p-0">
          <div
            ref={messageContainerRef}
            className="h-full overflow-y-auto p-6 space-y-4"
            onScroll={handleScroll}
          >
            {/* Rest of your messages rendering code remains the same */}
            {messages.map((message, index) => (
  <div
    key={index}
    className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} w-full mb-6`}
  >
    {/* Message Content */}
    <div
      className={`max-w-[80%] p-4 rounded-2xl ${
        message.type === 'user'
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-white shadow-sm rounded-bl-none'
      }`}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {message.content}
      </ReactMarkdown>
    </div>
    
    {/* Interactive Options */}
    {message.type === 'bot' && message.clarifications && (
      <div className="mt-3 max-w-[80%]">
        {message.clarifications.map((clarification:any, cIndex:any) => (
          <InteractiveOptions
            key={cIndex}
            question={clarification.question}
            options={clarification.options}
            onOptionSelect={(selectedOption:any) => {
              sendMessage(selectedOption);
            }}
          />
        ))}
      </div>
    )}

    {/* Audio Controls */}
    {message.type === 'bot' && (
      <div className="mt-2 max-w-[80%]">
        <AudioControls
          textToRead={getMessageTextContent(message)}
          language={selectedLanguage}
        />
      </div>
    )}
  </div>
))}
          </div>
        </div>
  
        {/* Input Container */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(userInput)}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendButton}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isRecording ? (
                <StopCircle className="h-5 w-5" />
              ) : !userInput.trim() ? (
                <Mic className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={resetConversation}
              className="p-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;