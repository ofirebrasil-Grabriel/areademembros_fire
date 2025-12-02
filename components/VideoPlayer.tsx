import React from 'react';

interface VideoPlayerProps {
  url: string;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) {
          videoId = url.split('/').pop() || '';
        } else {
          videoId = url.split('v=')[1]?.split('&')[0] || '';
        }
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
      if (url.includes('vimeo.com')) {
        const videoId = url.split('.com/')[1];
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
      }
    } catch (e) {
      console.error("Error parsing video URL", e);
    }
    return url;
  };

  const isEmbeddable = url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');

  if (!isEmbeddable) return null;

  return (
    <div className="w-full">
      {title && <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">{title}</h3>}
      <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
        <iframe
          src={getEmbedUrl(url)}
          className="absolute top-0 left-0 w-full h-full"
          title={title || "Video Player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};