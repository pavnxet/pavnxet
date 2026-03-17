'use client';

import React from 'react';
import Image from 'next/image';

interface ProjectCardProps {
  name: string;
  url: string;
  icon: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ name, url, icon }) => {
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const [imgSrc, setImgSrc] = React.useState(icon);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center border border-gray-100 hover:border-blue-200"
    >
      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
        <Image
          src={imgSrc}
          alt={name}
          width={40}
          height={40}
          className="object-contain"
          onError={() => {
            setImgSrc('https://www.google.com/s2/favicons?sz=64&domain=' + hostname);
          }}
          unoptimized={true} // Since we use external URLs and local uploads, and don't want to configure domains
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 text-center group-hover:text-blue-600 transition-colors">
        {name}
      </h3>
      <p className="text-sm text-gray-400 mt-1 truncate w-full text-center">
        {hostname}
      </p>
    </a>
  );
};

export default ProjectCard;
