import React from 'react';

interface ChromeSettingsCardProps {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const ChromeSettingsCard: React.FC<ChromeSettingsCardProps> = ({
  id,
  title,
  icon,
  description,
  children,
  className = '',
}) => {
  return (
    <section id={id} className={`flex flex-col gap-2 scroll-mt-6 ${className}`}>
      <div className="flex items-center gap-2 px-1">
        {icon && <span className="text-sky-600 dark:text-sky-400 text-base">{icon}</span>}
        <h2 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-neutral-400 px-1 -mt-1">{description}</p>
      )}
      <div className="rounded-2xl border border-gray-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden divide-y divide-gray-100 dark:divide-neutral-800/70">
        {children}
      </div>
    </section>
  );
};

interface ChromeSettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string | React.ReactNode;
  control?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ChromeSettingsRow: React.FC<ChromeSettingsRowProps> = ({
  icon,
  label,
  description,
  control,
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 gap-4 text-xs transition-colors ${
        isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-850' : ''
      } ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div className="text-gray-500 dark:text-neutral-400 mt-0.5 shrink-0 text-sm">
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-900 dark:text-neutral-200 text-xs truncate">
            {label}
          </span>
          {description && (
            <span className="text-[11.5px] text-gray-500 dark:text-neutral-400 leading-relaxed mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>
      {control && <div className="shrink-0 flex items-center gap-2">{control}</div>}
    </div>
  );
};
