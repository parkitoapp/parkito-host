import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadHookControl } from '@better-upload/client';
import type { FileUploadInfo } from '@better-upload/client';
import type { UploadStatus } from '@better-upload/client';
import { formatBytes } from '@better-upload/client/helpers';
import { Dot, File, X } from 'lucide-react';

export type PendingFileRow = { name: string; size: number; key: string };

type UploadProgressProps = {
  control?: UploadHookControl<true>;
  /** Single progress row (use when mapping over control.progresses) */
  progress?: FileUploadInfo<UploadStatus>;
  /** Single pending file row (use when mapping over pending files) */
  pendingFile?: PendingFileRow;
  removedFileKeys?: Set<string>;
  onRemoveFile?: (key: string) => void;
};

function ProgressRow({
  name,
  size,
  type,
  progress,
  status,
  onRemove,
  objectKey,
}: {
  name: string;
  size: number;
  type: string;
  progress: number;
  status: UploadStatus;
  onRemove?: (key: string) => void;
  objectKey: string;
}) {
  return (
    <div
      className={cn(
        'dark:bg-input/10 flex items-center gap-2 rounded-lg border bg-transparent p-3',
        {
          'bg-red-500/[0.04]! border-red-500/60': status === 'failed',
        }
      )}
    >
      <FileIcon type={type} />
      <div className="grid grow gap-1 min-w-0">
        <div className="flex items-center gap-0.5">
          <p className="max-w-40 truncate text-sm font-medium">{name}</p>
          <Dot className="text-muted-foreground size-4 shrink-0" />
          <p className="text-muted-foreground shrink-0 text-xs">
            {formatBytes(size)}
          </p>
        </div>
        <div className="flex h-4 items-center">
          {progress < 1 && status !== 'failed' ? (
            <Progress className="h-1.5" value={progress * 100} />
          ) : status === 'failed' ? (
            <p className="text-xs text-red-500">Failed</p>
          ) : (
            <p className="text-muted-foreground text-xs">Completed</p>
          )}
        </div>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(objectKey)}
          aria-label={`Rimuovi ${name}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

function PendingRow({
  name,
  size,
  key: rowKey,
  onRemove,
}: {
  name: string;
  size: number;
  key: string;
  onRemove?: (key: string) => void;
}) {
  return (
    <div className="dark:bg-input/10 flex items-center gap-2 rounded-lg border bg-transparent p-3">
      <FileIcon type="" />
      <div className="grid grow gap-1 min-w-0">
        <div className="flex items-center gap-0.5">
          <p className="max-w-40 truncate text-sm font-medium">{name}</p>
          <Dot className="text-muted-foreground size-4 shrink-0" />
          <p className="text-muted-foreground shrink-0 text-xs">
            {formatBytes(size)}
          </p>
        </div>
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(rowKey)}
          aria-label={`Rimuovi ${name}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function UploadProgress({
  control,
  progress: singleProgress,
  pendingFile,
  removedFileKeys,
  onRemoveFile,
}: UploadProgressProps) {
  // Single pending file row (map over pendingFiles)
  if (pendingFile) {
    return (
      <div className="grid gap-2">
        <PendingRow
          name={pendingFile.name}
          size={pendingFile.size}
          key={pendingFile.key}
          onRemove={onRemoveFile}
        />
      </div>
    );
  }

  // Single progress row (map over control.progresses)
  if (singleProgress && control) {
    if (removedFileKeys?.has(singleProgress.objectInfo.key)) return null;
    return (
      <div className="grid gap-2">
        <ProgressRow
          name={singleProgress.name}
          size={singleProgress.size}
          type={singleProgress.type}
          progress={singleProgress.progress}
          status={singleProgress.status}
          objectKey={singleProgress.objectInfo.key}
          onRemove={onRemoveFile}
        />
      </div>
    );
  }

  // Full list from control (default)
  if (!control) return null;
  const { progresses } = control;
  const displayedProgresses = removedFileKeys
    ? progresses.filter((p) => !removedFileKeys.has(p.objectInfo.key))
    : progresses;

  return (
    <div className="grid gap-2">
      {displayedProgresses.map((p) => (
        <ProgressRow
          key={p.objectInfo.key}
          name={p.name}
          size={p.size}
          type={p.type}
          progress={p.progress}
          status={p.status}
          objectKey={p.objectInfo.key}
          onRemove={onRemoveFile}
        />
      ))}
    </div>
  );
}

const iconCaptions = {
  'image/': 'IMG',
  'video/': 'VID',
  'audio/': 'AUD',
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  'application/x-rar-compressed': 'RAR',
  'application/x-7z-compressed': '7Z',
  'application/x-tar': 'TAR',
  'application/json': 'JSON',
  'application/javascript': 'JS',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'text/html': 'HTML',
  'text/css': 'CSS',
  'application/xml': 'XML',
  'application/x-sh': 'SH',
  'application/x-python-code': 'PY',
  'application/x-executable': 'EXE',
  'application/x-disk-image': 'ISO',
};

function FileIcon({ type }: { type: string }) {
  const caption = Object.entries(iconCaptions).find(([key]) =>
    type.startsWith(key)
  )?.[1];

  return (
    <div className="relative shrink-0">
      <File className="text-muted-foreground size-12" strokeWidth={1} />

      {caption && (
        <span className="bg-primary text-primary-foreground absolute bottom-2.5 left-0.5 select-none rounded px-1 py-px text-xs font-semibold">
          {caption}
        </span>
      )}
    </div>
  );
}
