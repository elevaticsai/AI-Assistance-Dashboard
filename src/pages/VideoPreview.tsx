import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

  
  // Update VideoPreview component to validate YouTube URL
  const VideoPreview = ({ href }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
  
    useEffect(() => {
      // Extract video ID from different types of YouTube URLs
      const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };
  
      const videoId = getYouTubeVideoId(href);
      if (videoId) {
        // Set thumbnail using YouTube's image API
        setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
        
        // Set proper embed URL
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
        
        // Fetch video title using YouTube's oEmbed API
        fetch(`https://www.youtube.com/oembed?url=${href}&format=json`)
          .then(res => res.json())
          .then(data => setVideoTitle(data.title))
          .catch(() => setVideoTitle('Video Preview'));
      }
    }, [href]);
  
    // Don't render anything if we couldn't get a valid video ID
    if (!embedUrl) {
      return null;
    }
  
    if (isPlaying) {
      return (
        <div className="rounded-lg overflow-hidden bg-gray-100 max-w-2xl">
          <iframe
            src={embedUrl}
            className="w-full aspect-video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  
    return (
      <div 
        className="relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer max-w-2xl group"
        onClick={() => setIsPlaying(true)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <img 
            src={thumbnailUrl} 
            alt={videoTitle}
            className="w-full h-full object-cover"
          />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 text-white group-hover:bg-red-700 transition-colors">
              <Play className="w-8 h-8 ml-1" />
            </div>
          </div>
        </div>
  
        {/* Video title */}
        <div className="p-3 bg-white">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {videoTitle || 'Loading...'}
          </h3>
        </div>
      </div>
    );
  };
export default VideoPreview;