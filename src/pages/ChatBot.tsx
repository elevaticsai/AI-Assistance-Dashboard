import React, { memo, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { Mic, Send, RotateCcw, StopCircle, Plane, Maximize2, Minimize2, PaperclipIcon, Smile } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import LinkComponent from "./LinkComponent";

// Component definitions with more modern styling
const components = {
  a: LinkComponent,
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-4 sm:pl-6 my-2 sm:my-3 text-gray-800">{children}</ol>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-4 sm:pl-6 my-2 sm:my-3 text-gray-800">{children}</ul>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-lg sm:text-xl font-bold my-3 sm:my-4 text-gray-900">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base sm:text-lg font-bold my-2 sm:my-3 text-gray-900">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm sm:text-base font-bold my-2 sm:my-3 text-gray-900">{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="font-bold my-2 text-gray-900">{children}</h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="my-2 sm:my-3 text-gray-800">{children}</p>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="px-1 py-0.5 bg-gray-100 rounded text-xs sm:text-sm text-gray-800"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={`${className} text-xs sm:text-sm block overflow-x-auto text-gray-800`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-gray-800 text-white p-2 sm:p-4 rounded-md overflow-x-auto my-3 sm:my-4 text-xs sm:text-sm">
      {children}
    </pre>
  ),
};

// Type interfaces remain the same
interface Message {
  type: "user" | "bot";
  content: string;
  isPlaying?: boolean;
  clarifications?: Array<{
    question: string;
    options: string[];
  }>;
  timestamp?: string;
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
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "hi-IN", label: "हिन्दी" },
  { value: "gu-IN", label: "ગુજરાતી" },
  { value: "kn-IN", label: "ಕನ್ನಡ" },
  { value: "ml-IN", label: "മലയാളം" },
  { value: "mr-IN", label: "मराठी" },
  { value: "ta-IN", label: "தமிழ் (இந்தியா)" },
  { value: "te-IN", label: "తెలుగు" },
  { value: "ur-IN", label: "اُردُو (بھارت)" },
];

const MODEL_OPTIONS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  {
    value: "meta-llama/llama-3.2-90b-vision-instruct",
    label: "Llama 3.2 90B (Vision)",
  },
  {
    value: "meta-llama/llama-3.2-11b-vision-instruct",
    label: "Llama 3.2 11B (Vision)",
  },
  { value: "meta-llama/llama-3.2-3b-instruct", label: "Llama 3.2 3B" },
  { value: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
  { value: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B" },
  { value: "meta-llama/llama-3-8b-instruct", label: "Llama 3 8B" },
  { value: "mistralai/mixtral-8x7b-instruct", label: "Mixtral 8x7B" },
  { value: "mistralai/mistral-7b-instruct", label: "Mistral 7B" },
];

const ChatUI = () => {
  const [processedQuery, setProcessedQuery] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_API_KEY;
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelOptions, setModelOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Speech synthesis states
  const [speechStatus, setSpeechStatus] = useState({ playing: false, index: -1 });

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentPlayingIndexRef = useRef<number>(-1);

  // All the useEffects and functions remain unchanged
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const response = await fetch(
          "https://api4prod.elevatics.site/models",
          {
            headers: {
              accept: "application/json",
              "X-API-Key": apiKey,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch models");
        const data = await response.json();

        if (!data.models || typeof data.models !== "object") {
          throw new Error("Invalid data format");
        }

        const fetchedModels = Object.entries(data.models).map(
          ([id, details]: [string, any]) => ({
            value: id,
            label: details.name,
          })
        );

        setModelOptions(fetchedModels);
        setSelectedModel(fetchedModels[0]?.value || null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [apiKey]);

  useEffect(() => {
    marked.setOptions({
      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      gfm: true,
      breaks: true,
      pedantic: false,
      headerIds: true,
      mangle: false,
    });
    resetConversation();
  }, []);

  const resetConversation = () => {
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setMessages([
      { 
        type: "bot", 
        content: "How can I help you with DigiYatra?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
    setUserInput("");
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
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  };

  const startRecording = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    setIsRecording(true);
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      if (isRecording) setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
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

  const parseInteractContent = (content: string) => {
    const clarifications = [];
    const regex = /- text: (.*?)\n\s*options:((?:\s*-[^\n]*\n)*)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const question = match[1].trim();
      const optionsText = match[2];
      const options = optionsText
        .split("\n")
        .map((opt) => opt.trim())
        .filter((opt) => opt.startsWith("-"))
        .map((opt) => opt.substring(1).trim())
        .filter(Boolean);

      if (question && options.length > 0) {
        clarifications.push({ question, options });
      }
    }

    return clarifications;
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { 
        type: "user", 
        content: marked.parse(message),
        timestamp
      },
    ]);
    setUserInput("");

    // Set loading to true when sending message
    setIsLoading(true);

    try {
      const response = await fetch("https://api4prod.elevatics.site/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          query: message,
          model_id: selectedModel || "anthropic.claude-3-haiku-20240307-v1:0",
          conversation_id: conversationId,
          user_id: "string",
          table_id: "digiyatra",
        }),
      });
      const reader = response.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }
      
console.log(reader, "response")

      let currentResponse = "";
      let currentClarifications: any[] = [];
      let interactContent = "";
      let isCollectingInteract = false;

      // Add a bot message placeholder with loading state
      setMessages((prev) => [...prev, { 
        type: "bot", 
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const eventData = JSON.parse(line.substring(6)) as EventData;

            if (eventData.type === "processed_query") {
              const content = eventData.content as string;
              setProcessedQuery(content);

              // Update the user's message with the processed query
              setMessages((prev) => {
                const newMessages = [...prev];
                // Find the most recent user message
                for (let i = newMessages.length - 2; i >= 0; i--) {
                  if (newMessages[i].type === "user") {
                    newMessages[i].content = marked.parse(content);
                    break;
                  }
                }
                return newMessages;
              });
            } else if (eventData.type === "token") {
              const content = eventData.content as any;

              if (content.includes("<interact>")) {
                isCollectingInteract = true;
                continue;
              }

              if (content.includes("</interact>")) {
                isCollectingInteract = false;
                const parsedClarifications =
                  parseInteractContent(interactContent);
                if (parsedClarifications.length > 0) {
                  currentClarifications = parsedClarifications;
                }
                interactContent = "";
                continue;
              }

              if (isCollectingInteract) {
                interactContent += content;
              } else {
                currentResponse += content;
              }

              const cleanContent = currentResponse
                .replace(/<interact>[\s\S]*?<\/interact>/g, "")
                .replace(/questions:\s*-\s*text:.*?(?=<|$)/gs, "")
                .replace(/options:\s*(?:-.*\n*)*?(?=<|$)/g, "")
                .replace(/^\s*[\r\n]/gm, "")
                .trim();

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.type === "bot") {
                  lastMessage.content = marked.parse(cleanContent);
                  if (currentClarifications.length > 0) {
                    lastMessage.clarifications = currentClarifications;
                  }
                }
                return newMessages;
              });
            } else if (
              eventData.type === "metadata" &&
              eventData.response_full?.clarification
            ) {
              if (currentClarifications.length === 0) {
                currentClarifications = eventData.response_full.clarification;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.type === "bot") {
                    lastMessage.clarifications = currentClarifications;
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.error("Error parsing event:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "An error occurred while processing your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } finally {
      // Set loading to false when done
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // Function to split text into manageable chunks
  const splitTextIntoChunks = (text: string, chunkSize: number) => {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      // Try to find a natural break point (period, question mark, etc.)
      let endIndex = Math.min(startIndex + chunkSize, text.length);
      if (endIndex < text.length) {
        const nextPeriod = text.indexOf(".", endIndex - 30);
        const nextQuestion = text.indexOf("?", endIndex - 30);
        const nextExclamation = text.indexOf("!", endIndex - 30);
        const nextLineBreak = text.indexOf("\n", endIndex - 30);

        const possibleBreaks = [
          nextPeriod,
          nextQuestion,
          nextExclamation,
          nextLineBreak,
        ].filter((pos) => pos !== -1 && pos < endIndex + 30);

        if (possibleBreaks.length > 0) {
          endIndex = Math.min(...possibleBreaks) + 1;
        }
      }

      chunks.push(text.substring(startIndex, endIndex).trim());
      startIndex = endIndex;
    }

    return chunks;
  };

  // Function to speak text chunks sequentially with improved error handling
  const speakTextChunks = (chunks: string[], messageIndex: number) => {
    if (
      chunks.length === 0 ||
      currentPlayingIndexRef.current !== messageIndex
    ) {
      // All chunks spoken or playback was stopped
      setMessages((prev) =>
        prev.map((m, i) =>
          i === messageIndex ? { ...m, isPlaying: false } : m
        )
      );
      currentPlayingIndexRef.current = -1;
      setSpeechStatus({ playing: false, index: -1 });
      return;
    }

    const chunk = chunks[0];
    const utterance = new SpeechSynthesisUtterance(chunk);

    // Set language based on selectedLanguage
    utterance.lang = selectedLanguage;

    utterance.onend = () => {
      // Check if we should continue playing (not manually stopped)
      if (currentPlayingIndexRef.current === messageIndex) {
        speakTextChunks(chunks.slice(1), messageIndex);
      }
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event.error);

      // Small delay before attempting to continue
      setTimeout(() => {
        // If error is "interrupted" try to continue from same chunk
        if (
          event.error === "interrupted" &&
          currentPlayingIndexRef.current === messageIndex
        ) {
          // Try to speak this chunk again
          window.speechSynthesis.cancel(); // Clear any pending speech
          const retryUtterance = new SpeechSynthesisUtterance(chunk);
          retryUtterance.lang = selectedLanguage;
          retryUtterance.onend = utterance.onend;
          retryUtterance.onerror = utterance.onerror;

          currentUtteranceRef.current = retryUtterance;
          window.speechSynthesis.speak(retryUtterance);
        } else if (currentPlayingIndexRef.current === messageIndex) {
          // For other errors, continue with next chunk
          speakTextChunks(chunks.slice(1), messageIndex);
        }
      }, 300);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Add this function to clean message content before rendering
  const cleanMessageContent = (content: string): string => {
    return content
      .replace(/<interact>[\s\S]*?<\/interact>/g, "") // Remove interact blocks completely
      .replace(/<interact</g, "&lt;interact&lt;") // Escape any malformed interact tags
      .replace(/questions:\s*-\s*text:.*?(?=<|$)/gs, "") // Remove questions
      .replace(/options:\s*(?:-.*\n*)*?(?=<|$)/g, "") // Remove options
      .replace(/^\s*[\r\n]/gm, "") // Remove empty lines
      .trim();
  };

  // Add this function somewhere in your component
const decodeHTMLEntities = (text) => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};
  // Fixed toggleAudio function to avoid the "hash 39" issue
  const toggleAudio = (index: number) => {
    try {
      // Check if already playing this message
      if (speechStatus.playing && speechStatus.index === index) {
        // Stop the current playback
        window.speechSynthesis.cancel();
        currentUtteranceRef.current = null;
        currentPlayingIndexRef.current = -1;
        setSpeechStatus({ playing: false, index: -1 });

        setMessages((prev) =>
          prev.map((m, i) => (i === index ? { ...m, isPlaying: false } : m))
        );
        return;
      }

      // Stop any currently playing audio
      if (speechStatus.playing) {
        window.speechSynthesis.cancel();
        setMessages((prev) =>
          prev.map((m, i) =>
            i === speechStatus.index ? { ...m, isPlaying: false } : m
          )
        );
      }

      // Start playing the new message
      const message = messages[index];
      if (message.type !== "bot") return;

      // Use the cleanMessageContent function to clean the text before converting to speech
      let cleanedContent = cleanMessageContent(message.content);

      // Further simplify for speech by removing markdown and HTML formatting
      const textToSpeak = decodeHTMLEntities(cleanedContent
        .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
        .replace(/\*(.*?)\*/g, "$1") // Italic
        .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
        .replace(/#{1,6}\s+(.*?)(?:\n|$)/g, "$1") // Headers
        .replace(/```[\s\S]*?```/g, "") // Code blocks
        .replace(/`(.*?)`/g, "$1") // Inline code
        .replace(/<[^>]*>/g, " ") // Any remaining HTML tags
        .replace(/\n+/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Normalize spaces
        .trim());

      // Mark as playing
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, isPlaying: true } : m))
      );

      // Set the current playing index
      currentPlayingIndexRef.current = index;
      setSpeechStatus({ playing: true, index });

      // Split text into chunks and speak
      const chunks = splitTextIntoChunks(textToSpeak, 200);
      speakTextChunks(chunks, index);
    } catch (error) {
      console.error("Error in toggleAudio:", error);
      // Reset the speech state in case of error
      window.speechSynthesis.cancel();
      currentPlayingIndexRef.current = -1;
      setSpeechStatus({ playing: false, index: -1 });

      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, isPlaying: false } : m))
      );
    }
  };
  
  // Add this useEffect to handle speech synthesis resuming
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && speechStatus.playing) {
        window.speechSynthesis.pause();
      } else if (speechStatus.playing) {
        window.speechSynthesis.resume();
      }
    };

    // Browser may pause speech synthesis after a certain period
    // This interval keeps it active with more frequent checks
    const intervalId = setInterval(() => {
      if (speechStatus.playing) {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 5000); // Every 5 seconds for more reliability

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Clean up any ongoing speech synthesis when component unmounts
      window.speechSynthesis.cancel();
    };
  }, [speechStatus]);

  // Apply chatWindow classes based on fullscreen state
  const chatWindowClasses = isChatFullScreen
    ? 'fixed inset-0 z-50 m-0 w-full h-full'
    : 'w-full max-w-[900px] mx-auto p-2 sm:p-2.5 h-screen';

  return (
    <div className={chatWindowClasses}>
      <div className={`bg-white ${isChatFullScreen ? 'h-full rounded-none' : 'h-[98vh] rounded-2xl shadow-xl'} overflow-hidden flex flex-col transition-all duration-300`}>
        {/* Modern gradient header */}
    {/* Modern gradient header with better robot icon */}
{/* Modern gradient header with new robot icon */}
<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4 flex items-center justify-between">
  <div className="flex items-center space-x-3">
    <div className="bg-white p-2 rounded-full shadow-md">
      {/* New, cleaner robot icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="9" width="16" height="12" rx="2" />
        <circle cx="9" cy="14" r="1.5" fill="currentColor" />
        <circle cx="15" cy="14" r="1.5" fill="currentColor" />
        <path d="M8 3h8l2 4H6l2-4z" />
        <path d="M12 17h0.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div>
      <h3 className="font-semibold text-base sm:text-lg">DigiYatra Assistant</h3>
      {/* <div className="flex items-center space-x-1 text-xs">
        <span className="h-2 w-2 bg-green-400 rounded-full inline-block"></span>
        <span className="text-indigo-100">Online</span>
      </div> */}
    </div>
  </div>

  <button
    onClick={() => setIsChatFullScreen(!isChatFullScreen)}
    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
  >
    {isChatFullScreen ? 
      <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" /> : 
      <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  </button>
</div>

        {/* Modern selection bar */}
        <div className="bg-indigo-50 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div
            ref={modelDropdownRef}
            className="relative flex-grow sm:flex-grow-0"
          >
            <label htmlFor="model-select" className="block text-xs text-indigo-800 mb-1 font-medium">Model</label>
            <select
              id="model-select"
              value={selectedModel || ""}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-white text-gray-800 rounded-md px-3 py-2 text-xs sm:text-sm border border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>Select Model</option>
              {modelOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-xs sm:text-sm"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div ref={languageDropdownRef} className="relative flex-grow sm:flex-grow-0">
            <label htmlFor="language-select" className="block text-xs text-indigo-800 mb-1 font-medium">Language</label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-white text-gray-800 rounded-md px-3 py-2 text-xs sm:text-sm border border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-xs sm:text-sm"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Container with soft background */}
       {/* Messages Container with soft background */}
<div
  ref={messageContainerRef}
  className={`messages flex-1 overflow-y-auto p-4 ${isChatFullScreen ? 'pb-24' : 'pb-6'} bg-gradient-to-b from-indigo-50 to-white`}
  onScroll={handleScroll}
>
  <div className={`${isChatFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
    {messages.map((message, index) => (
      <div
        key={index}
        className={`flex ${
          message.type === "user" ? "justify-end" : "justify-start"
        } animate-fadeIn mb-6`}
      >
        {/* Bot avatar for bot messages - UPDATED with robot icon */}
        {message.type === "bot" && (
  <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 mr-2 flex items-center justify-center shadow-sm">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="9" width="16" height="12" rx="2" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" />
      <path d="M8 3h8l2 4H6l2-4z" />
      <path d="M12 17h0.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)}
        
        <div
          className={`${
            isChatFullScreen 
              ? 'max-w-[80%]' 
              : 'max-w-[85%]'
          } p-4 shadow-sm ${
            message.type === "user"
              ? "bg-indigo-500 text-white rounded-2xl rounded-tr-sm"
              : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-indigo-100 shadow-md"
          }`}
        >
          {/* Fixed: Ensuring text is white for user messages */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={message.type === "user" ? 
              {...components, p: ({children}: {children: React.ReactNode}) => (
                <p className="my-2 sm:my-3 text-white">{children}</p>
              )} : 
              components
            }
            className="prose prose-sm max-w-none break-words text-xs sm:text-sm md:text-base"
          >
            {message.type === "bot"
              ? cleanMessageContent(message.content)
              : message.content}
          </ReactMarkdown>

          {message.type === "bot" &&
            message.clarifications &&
            message.clarifications.length > 0 && (
              <div className="clarification-section mt-4 p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-md text-sm">
                {message.clarifications.map((clarification, cIndex) => (
                  <div key={cIndex} className="mb-3">
                    <strong className="text-indigo-700">
                      {clarification.question}
                    </strong>
                    <div className="option-buttons flex flex-wrap gap-2 mt-2">
                      {clarification.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => sendMessage(option)}
                          className="option-button px-3 py-1.5 bg-white border border-indigo-300 rounded-full text-xs sm:text-sm hover:bg-indigo-100 transition-colors text-indigo-800 shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          <div className="flex items-center justify-between mt-2">
            {message.type === "bot" && (
              <button
                onClick={() => toggleAudio(index)}
                className="audio-button flex items-center text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
                aria-label={message.isPlaying ? "Stop speaking" : "Speak message"}
              >
                {message.isPlaying ? (
                  <div className="flex items-center bg-indigo-100 px-2 py-1 rounded-full">
                    <svg
                      className="w-4 h-4 mr-1"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    Stop
                  </div>
                ) : (
                  <div className="flex items-center bg-indigo-100 px-2 py-1 rounded-full">
                    <svg
                      className="w-4 h-4 mr-1"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </div>
                )}
              </button>
            )}
            <span className={`text-xs ${message.type === "user" ? "text-white text-opacity-80" : "text-gray-500"} ml-auto`}>
              {message.timestamp}
            </span>
          </div>
        </div>
        
        {/* User avatar for user messages */}
        {message.type === "user" && (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 ml-2 flex items-center justify-center shadow-sm">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
            </svg>
          </div>
        )}
      </div>
    ))}
  </div>
  
 {/* Update the loading indicator with the same robot icon */}
{isLoading && (
  <div className="flex justify-start mb-4">
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 mr-2 flex items-center justify-center shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="9" width="16" height="12" rx="2" />
        <circle cx="9" cy="14" r="1.5" fill="currentColor" />
        <circle cx="15" cy="14" r="1.5" fill="currentColor" />
        <path d="M8 3h8l2 4H6l2-4z" />
        <path d="M12 17h0.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-md max-w-[85%] border border-indigo-100">
      <div className="flex space-x-2">
        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-typing"></div>
        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-typing" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-typing" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  </div>
)}
</div>

        {/* Modern Input Container with frosted glass effect */}
        <div className={`input-area bg-white bg-opacity-90 backdrop-blur-sm border-t border-indigo-100 p-4 ${isChatFullScreen ? 'fixed bottom-0 left-0 right-0 z-10' : ''}`}>
          <div className={`flex gap-2 ${isChatFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="relative flex-grow rounded-full border-2 border-indigo-200 focus-within:border-indigo-500 bg-white overflow-hidden shadow-sm flex items-center px-2 sm:px-4">
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage(userInput)}
        placeholder="Type your message..."
        className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base bg-transparent text-gray-800 focus:outline-none"
      />
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button className="text-gray-400 hover:text-indigo-500 p-1 transition-colors">
          <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button className="text-gray-400 hover:text-indigo-500 p-1 transition-colors">
          <PaperclipIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
            
            <button
              onClick={handleSendButton}
              className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-700 text-white rounded-full hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center shadow-md"
              disabled={isLoading}
            >
              {isRecording ? (
                <StopCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : !userInput.trim() ? (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            
            <button
              onClick={resetConversation}
              className="w-12 h-12 bg-white border-2 border-indigo-200 text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors flex items-center justify-center shadow-sm"
              title="Reset conversation"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Base styles and animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes typing {
          0%, 100% {
            transform: translateY(0);
            background-color: rgba(79, 70, 229, 1);
          }
          50% {
            transform: translateY(-10px);
            background-color: rgba(99, 102, 241, 0.8);
          }
        }
        .animate-typing {
          animation: typing 1.4s infinite;
        }
        
        /* Light theme styling */
        .prose {
          color: #1f2937;
        }
        
        .prose strong {
          color: #111827;
          font-weight: 600;
        }
        
        .prose a {
          color: #4f46e5;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .prose pre {
            padding: 0.75rem !important;
          }
          
          .prose code {
            font-size: 0.8rem !important;
          }
        }
      `}</style>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        
        body {
          font-family: "Inter", sans-serif;
          line-height: 1.6;
          color: #333;
          font-size: 14px;
          background-color: #f9fafb;
        }
        
        @media (min-width: 640px) {
          body {
            font-size: 16px;
          }
        }
        
        /* Improve focus indicators */
        input:focus, select:focus, button:focus {
          outline: 2px solid rgba(79, 70, 229, 0.5);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default memo(ChatUI);