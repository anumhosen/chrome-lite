import React, { useState, useEffect } from 'react';
import { VscCloudDownload, VscFolderOpened, VscFolder } from 'react-icons/vsc';
import { ChromeSettingsCard, ChromeSettingsRow } from './ChromeSettingsCard';
import { ChromeToggle } from './ChromeToggle';
import { chromeApi } from '../../../services/chromeApi';

interface DownloadsSettingsProps {
  config: any;
  onUpdateSetting: (key: string, value: any) => void;
  onNotify?: (msg: string) => void;
}

export const DownloadsSettings: React.FC<DownloadsSettingsProps> = ({
  config,
  onUpdateSetting,
  onNotify,
}) => {
  const [downloadPath, setDownloadPath] = useState<string>('Downloads');
  const [askSavePath, setAskSavePath] = useState<boolean>(true);

  useEffect(() => {
    if (config?.downloadPath) {
      setDownloadPath(config.downloadPath);
    }
    const askPref = localStorage.getItem('chrome_download_ask_where');
    if (askPref !== null) {
      setAskSavePath(askPref === 'true');
    }
  }, [config]);

  const handleToggleAsk = (checked: boolean) => {
    setAskSavePath(checked);
    localStorage.setItem('chrome_download_ask_where', String(checked));
    onUpdateSetting('askDownloadPath', checked);
    onNotify?.(checked ? 'Will ask where to save each file' : 'Downloads will save automatically to folder');
  };

  const handleOpenFolder = () => {
    if (chromeApi?.downloads?.openFolder) {
      chromeApi.downloads.openFolder();
      onNotify?.('Opened Downloads folder');
    }
  };

  return (
    <ChromeSettingsCard
      id="section-downloads"
      title="Downloads"
      icon={<VscCloudDownload />}
      description="Manage downloaded file destinations and prompts."
    >
      {/* Download Location */}
      <ChromeSettingsRow
        icon={<VscFolder />}
        label="Location"
        description={downloadPath || 'Default OS Downloads directory'}
        control={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFolder}
              title="Open Downloads folder in file explorer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-750 font-medium text-xs transition-colors"
            >
              <VscFolderOpened size={13} />
              <span>Open Folder</span>
            </button>
          </div>
        }
      />

      {/* Ask where to save each file */}
      <ChromeSettingsRow
        label="Ask where to save each file before downloading"
        description="Displays the native OS Save As dialog prompt for every downloaded file."
        control={
          <ChromeToggle
            checked={askSavePath}
            onChange={handleToggleAsk}
            title="Ask where to save each file"
          />
        }
      />
    </ChromeSettingsCard>
  );
};
