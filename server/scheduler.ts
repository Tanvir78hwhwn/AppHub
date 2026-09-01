import { db } from './db';
import { detectResource, executeImport } from './universalImporter';
import { ImportJob, ImportSource, SchedulerInterval } from '../src/types';

let schedulerTimer: NodeJS.Timeout | null = null;
let isJobRunning = false;

/**
 * Executes an import cycle across active trusted sources
 */
export async function runSchedulerCycle(targetSourceId?: string): Promise<ImportJob[]> {
  if (isJobRunning) {
    console.log('[Scheduler] A job cycle is already running. Skipping trigger.');
    return [];
  }

  isJobRunning = true;
  const completedJobs: ImportJob[] = [];

  try {
    const sources = db.getImportSources().filter(s => s.enabled && (targetSourceId ? s.id === targetSourceId : true));
    const settings = db.getPricingSettings();

    for (const source of sources) {
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const job: ImportJob = {
        id: jobId,
        sourceId: source.id,
        sourceName: source.name,
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        foundCount: 0,
        importedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        errorLogs: []
      };
      db.addImportJob(job);

      try {
        console.log(`[Scheduler] Polling source: ${source.name} (${source.baseUrl})`);
        
        // Inspect base URL / feed
        const detection = await detectResource(source.baseUrl, source.id);
        if (!detection.success || !detection.resource) {
          job.errorLogs.push(`Failed to detect resource at ${source.baseUrl}: ${detection.error}`);
          job.failedCount++;
          job.status = 'FAILED';
          job.finishedAt = new Date().toISOString();
          db.updateImportJob(job.id, job);
          completedJobs.push(job);
          continue;
        }

        job.foundCount = 1;

        // Check if duplicate
        if (detection.duplicateInfo?.isDuplicate) {
          job.skippedCount++;
          job.errorLogs.push(`Skipped duplicate resource: ${detection.duplicateInfo.reason}`);
          job.status = 'COMPLETED';
          job.finishedAt = new Date().toISOString();
          db.updateImportJob(job.id, job);
          completedJobs.push(job);
          continue;
        }

        // Execute import
        const importResult = await executeImport({
          itemData: detection.resource,
          sourceId: source.id,
          jobId: job.id,
          forceAutoPublish: source.trusted && settings.automationMode === 'FULL AUTO'
        });

        if (importResult.success) {
          job.importedCount++;
          job.status = 'COMPLETED';
        } else {
          job.failedCount++;
          job.errorLogs.push(importResult.error || 'Import failed during execution.');
          job.status = 'FAILED';
        }

        job.finishedAt = new Date().toISOString();
        db.updateImportJob(job.id, job);
        db.updateImportSource(source.id, { lastPolledAt: new Date().toISOString() });
        completedJobs.push(job);
      } catch (srcErr: any) {
        job.status = 'FAILED';
        job.errorLogs.push(srcErr.message || 'Unexpected source polling exception.');
        job.finishedAt = new Date().toISOString();
        db.updateImportJob(job.id, job);
        completedJobs.push(job);
      }
    }
  } finally {
    isJobRunning = false;
  }

  return completedJobs;
}

/**
 * Initializes and starts background scheduler based on configured interval
 */
export function initScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  const settings = db.getPricingSettings();
  const interval = settings.schedulerInterval || '1h';

  if (interval === 'DISABLED') {
    console.log('[Scheduler] Background automation scheduler is disabled.');
    return;
  }

  const intervalMsMap: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };

  const ms = intervalMsMap[interval] || 60 * 60 * 1000;
  console.log(`[Scheduler] Automation scheduler started with interval: ${interval} (${ms}ms)`);

  schedulerTimer = setInterval(() => {
    runSchedulerCycle().catch(err => console.error('[Scheduler] Error in automated run cycle:', err));
  }, ms);
}

/**
 * Updates scheduler interval config and re-arms timer
 */
export function updateSchedulerInterval(interval: SchedulerInterval) {
  db.updatePricingSettings({ schedulerInterval: interval });
  initScheduler();
}
