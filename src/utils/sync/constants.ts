/** IndexedDB 数据库配置 */
export const DB_CONFIG = {
  name: 'RecordSyncDB',
  version: 1
}

/** 智能轮询配置 */
export const POLL_CONFIG = {
  minInterval: 3000,
  maxInterval: 60000,
  defaultInterval: 8000,
  adaptiveFactors: {
    networkGood: 0.8,
    networkPoor: 2.0,
    hasPending: 0.7,
    noPending: 1.2,
  }
}

/** 变更合并配置 */
export const MERGE_CONFIG = {
  window: 2000,
  rules: {
    'create+update': 'create',
    'create+delete': 'discard',
    'update+update': 'merge',
    'update+delete': 'delete',
    'delete+create': 'create',
    'delete+update': 'delete',
  } as Record<string, string>
}

/** 网络重试配置 */
export const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  timeout: 15000,
  errorStrategy: {
    'NETWORK_OFFLINE': false,
    'NETWORK_TIMEOUT': true,
    'NETWORK_ERROR': true,
    'SERVER_UNAVAILABLE': true,
    'SERVER_BUSY': true,
  } as Record<string, boolean>
}

/** 数据备份配置 */
export const BACKUP_CONFIG = {
  localStorageLimit: 10,
  backupRetention: 86400000,          // 24h
}

/** 批量推送配置 */
export const PUSH_CONFIG = {
  batchSize: 50,
  compressionThreshold: 1024,  // 1KB
}

/** 分页拉取配置 */
export const PULL_CONFIG = {
  pageSize: 100,
  maxConcurrency: 2,
}

/** 全量同步配置 */
export const FULL_SYNC_CONFIG = {
  batchSize: 500,
  parallelEntities: true,
}

/** 网络质量评估 */
export const NETWORK_CONFIG = {
  pingTimeout: 5000,         // 5s
  goodLatencyThreshold: 500, // ms
}
