import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid"; // uuidv4 for generating unique IDs
import axios from "axios";
import { marked } from "marked";
import "highlight.js/styles/atom-one-dark.css";
import "./styles.css"; // Assume this file contains the CSS from the original HTML

type Message = {
  type: "user" | "bot";
  content: string;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-4o-mini");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [isScrollingUp, setIsScrollingUp] = useState<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    resetConversation();
  }, []);

  const resetConversation = (): void => {
    setMessages([{ type: "bot", content: "How can I help you with DigiYatra?" }]);
    setUserInput("");
    setConversationId(uuidv4());
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = 0;
    }
  };

  const handleSendButton = async (): Promise<void> => {
    if (isRecording) {
      stopRecording();
    } else if (!userInput.trim()) {
      startRecording();
    } else {
      await sendMessage();
    }
  };

//   const sendMessage = async (): Promise<void> => {
//     if (!userInput.trim()) return;

//     const userMessage: Message = { type: "user", content: marked.parse(userInput) };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);

//     const botPlaceholder: Message = { type: "bot", content: "" };
//     const newMessageIndex = messages.length;
//     setMessages((prevMessages) => [...prevMessages, botPlaceholder]);

//     try {
//       const response = await axios.post(
//         "https://pvanand-rag-chat-with-analytics.hf.space/digiyatra-followup",
//         {
//           query: userInput,
//           model_id: selectedModel,
//           conversation_id: conversationId,
//           user_id: "digiyatra",
//         }
//       );

//       const botResponse = marked.parse(response.data.content);
//       setMessages((prevMessages) => {
//         const updatedMessages = [...prevMessages];
//         updatedMessages[newMessageIndex].content = botResponse;
//         return updatedMessages;
//       });
//     } catch (error) {
//       console.error("Error sending message:", error);
//     }

//     setUserInput("");
//   };

const sendMessage = async (): Promise<void> => {
    if (!userInput.trim()) return;
  
    const userMessage: Message = { type: "user", content: marked.parse(userInput) };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
  
    const botPlaceholder: Message = { type: "bot", content: "" };
    const newMessageIndex = messages.length;
    setMessages((prevMessages) => [...prevMessages, botPlaceholder]);
  
    try {
      const response = await axios.post(
        "https://pvanand-rag-chat-with-analytics.hf.space/digiyatra-followup",
        {
          query: userInput,
          model_id: selectedModel,
          conversation_id: conversationId,
          user_id: "digiyatra",
        }
      );
  
      // Log the response to inspect the structure
      console.log('Response data:', response.data);
  
      // Access the full response from the nested metadata structure
      const fullResponse = response.data.metadata?.response_full?.response;
  
      // Check if the response exists and is a string
      if (typeof fullResponse === 'string') {
        const parsedResponse = marked.parse(fullResponse);
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[newMessageIndex].content = parsedResponse;
          return updatedMessages;
        });
      } else {
        console.error("Unexpected response structure: response is not a string.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  
    setUserInput("");
  };
  
  const startRecording = (): void => {
    alert("Speech recognition functionality is not yet implemented.");
  };

  const stopRecording = (): void => {
    setIsRecording(false);
  };

  const scrollToBottom = (): void => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  return (
    <div id="app">
      <div className="chat-container">
        <div className={`chat-header ${isScrollingUp ? "header-hidden" : ""}`}>DigiYatra Assistant</div>
        <div
          className="messages"
          ref={messageContainerRef}
          onScroll={(e) =>
            setIsScrollingUp((e.target as HTMLDivElement).scrollTop < (e.target as HTMLDivElement).scrollHeight)
          }
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type === "user" ? "user-message" : "bot-message"}`}
              dangerouslySetInnerHTML={{ __html: message.content }}
            ></div>
          ))}
        </div>
        <div className={`input-area ${isScrollingUp ? "input-hidden" : ""}`}>
          <input
            type="text"
            id="user-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendButton()}
            placeholder="Type your message..."
          />
          <button className="send-button" onClick={handleSendButton}>Send</button>
        </div>
        <div className="settings-area">
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            <option value="meta-llama/llama-3.2-90b-vision-instruct">Llama 3.2 90B (Vision)</option>
          </select>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">हिन्दी</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Chat;
