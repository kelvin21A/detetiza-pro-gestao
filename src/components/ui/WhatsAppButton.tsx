import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface WhatsAppButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  className?: string;
  disabled?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  onClick, 
  text = 'Conversar no WhatsApp',
  className = '',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium 
        bg-[#25D366] text-white 
        hover:bg-[#1DA851] 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA851] 
        transition-all duration-200 ease-in-out 
        shadow-md hover:shadow-lg 
        px-4 py-2 
        disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none
        ${className}
      `}
    >
      <WhatsAppIcon className="w-5 h-5 mr-2" />
      {text}
    </button>
  );
};
