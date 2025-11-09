import React from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { PlusIcon } from '@/presentation/components/icons/Icons';
import { SplitText } from '@/presentation/components/animated/Animated';

interface HeaderProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, description, buttonText, onButtonClick }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex-grow">
        <SplitText
          text={title}
          className="text-2xl sm:text-3xl font-bold text-foreground dark:text-dark-foreground"
          duration={0.8}
          stagger={0.05}
        />
        <p className="text-muted-foreground dark:text-dark-muted-foreground mt-1">{description}</p>
      </div>
      {buttonText && onButtonClick && (
        <Button onClick={onButtonClick} className="flex-shrink-0 w-full sm:w-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default Header;
