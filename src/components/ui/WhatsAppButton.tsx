import React from 'react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

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
        inline-flex items-center justify-center rounded-full text-sm font-bold uppercase tracking-wider
        bg-[#25D366] text-white 
        hover:bg-[#1DA851] hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA851] 
        transition-all duration-300 ease-in-out 
        shadow-md
        px-5 py-2.5
        disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none
        ${className}
      `}
    >
      <WhatsAppIcon className="w-5 h-5 mr-2" />
      {text}
    </button>
  );
};
