import { UserIcon } from '../icons/user-icon';
import { BotIcon } from '../icons/bot-icon';

interface AvatarProps {
  type: 'user' | 'bot';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ type, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const baseClasses = `${sizes[size]} rounded-full flex items-center justify-center ${className}`;

  if (type === 'user') {
    return (
      <div className={`${baseClasses} bg-blue-500 text-white`}>
        <UserIcon className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-gray-800 text-white`}>
      <BotIcon className={iconSizes[size]} />
    </div>
  );
}