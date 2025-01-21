import { Play, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Add this component for audio controls
const AudioControls = ({ textToRead, language }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const speechSynthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);
  
    const handlePlay = () => {
      if (!textToRead) return;
  
      if (isPlaying) {
        speechSynthRef.current.cancel();
        setIsPlaying(false);
        return;
      }
  
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      // Set language based on selected language
      utterance.lang = language;
      
      // Handle end of speech
      utterance.onend = () => {
        setIsPlaying(false);
      };
  
      // Handle errors
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
      };
  
      utteranceRef.current = utterance;
      speechSynthRef.current.speak(utterance);
      setIsPlaying(true);
    };
  
    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (speechSynthRef.current) {
          speechSynthRef.current.cancel();
        }
      };
    }, []);
  
    return (
      <button
        onClick={handlePlay}
        className="mt-2 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
      >
        {isPlaying ? (
          <>
            <StopCircle className="w-5 h-5" />
            <span>Stop Reading</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>Read Aloud</span>
          </>
        )}
      </button>
    );
  };
  

  export default AudioControls;