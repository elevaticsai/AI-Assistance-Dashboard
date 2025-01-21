import { memo } from "react";
import VideoPreview from "./VideoPreview";

const LinkComponent = memo(({ href, children, ...props }) => {
    // Function to check if URL is a YouTube link
    const isYouTubeUrl = (url) => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      return youtubeRegex.test(url);
    };
  
    // If it's a YouTube URL, render VideoPreview
    if (isYouTubeUrl(href)) {
      return <VideoPreview href={href} />;
    }
  
    // For all other links, render a normal anchor tag
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
        {...props}
      >
        {children || href}
      </a>
    );
  });

  export default LinkComponent;