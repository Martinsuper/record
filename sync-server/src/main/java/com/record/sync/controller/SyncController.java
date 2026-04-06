package com.record.sync.controller;

import com.record.sync.dto.*;
import com.record.sync.service.DataCleanupService;
import com.record.sync.service.SnapshotService;
import com.record.sync.service.SyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final SnapshotService snapshotService;
    private final DataCleanupService dataCleanupService;

    @GetMapping("/pull")
    public ResponseEntity<ApiResponse<SyncPullResult>> pull(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion) {
        try {
            SyncPullResult result = syncService.pull(spaceId, sinceVersion);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Pull sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("拉取同步失败：" + e.getMessage()));
        }
    }

    @PostMapping("/push")
    public ResponseEntity<ApiResponse<SyncPushResult>> push(
            @RequestBody SyncPushRequest request) {
        try {
            SyncPushResult result = syncService.push(
                    request.getSpaceId(),
                    request.getDeviceId(),
                    request.getChanges());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Push sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("推送同步失败：" + e.getMessage()));
        }
    }

    @GetMapping("/full")
    public ResponseEntity<ApiResponse<SyncFullResult>> fullSync(
            @RequestParam String spaceId) {
        try {
            SyncFullResult result = syncService.fullSync(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Full sync error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("全量同步失败：" + e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SyncStatusResult>> status(
            @RequestParam String spaceId) {
        try {
            SyncStatusResult result = syncService.getStatus(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get sync status error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取状态失败：" + e.getMessage()));
        }
    }

    // ===== Task 5b: New endpoints =====

    @GetMapping("/hash")
    public ResponseEntity<ApiResponse<SyncHashResult>> getHash(
            @RequestParam String spaceId) {
        try {
            SyncHashResult result = syncService.getHash(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get hash error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取数据 hash 失败"));
        }
    }

    @PostMapping("/push-diff")
    public ResponseEntity<ApiResponse<List<String>>> pushDiff(
            @RequestBody DiffPushRequest request) {
        try {
            List<String> accepted = syncService.pushDiff(
                    request.getSpaceId(), request.getDeviceId(), request);
            return ResponseEntity.ok(ApiResponse.success(accepted));
        } catch (Exception e) {
            log.error("Push diff error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("差异推送失败"));
        }
    }

    @PostMapping("/batch-push")
    public ResponseEntity<ApiResponse<BatchPushResult>> batchPush(
            @RequestBody SyncPushRequest request) {
        try {
            BatchPushResult result = syncService.batchPush(
                    request.getSpaceId(), request.getDeviceId(), request.getChanges());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Batch push error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("批量推送失败"));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping(@RequestParam String deviceId) {
        syncService.updateDeviceStatus(deviceId, "active");
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/device-status")
    public ResponseEntity<List<DeviceStatusResult>> deviceStatus(
            @RequestParam String spaceId) {
        List<DeviceStatusResult> result = syncService.getDeviceStatus(spaceId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/meta")
    public ResponseEntity<ApiResponse<SyncMetaResult>> meta(
            @RequestParam String spaceId) {
        try {
            SyncMetaResult result = syncService.getMeta(spaceId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get meta error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取元数据失败: " + e.getMessage()));
        }
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<PagePullResult>> getEvents(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "events", limit, offset);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get events error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取事件失败"));
        }
    }

    @GetMapping("/anniversaries")
    public ResponseEntity<ApiResponse<PagePullResult>> getAnniversaries(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "anniversaries", limit, offset);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get anniversaries error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取纪念日失败"));
        }
    }

    @GetMapping("/event-types")
    public ResponseEntity<ApiResponse<PagePullResult>> getEventTypes(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "eventTypes", limit, offset);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get event types error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取事件类型失败"));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<PagePullResult>> getCategories(
            @RequestParam String spaceId,
            @RequestParam(defaultValue = "0") Long sinceVersion,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            PagePullResult result = syncService.pullPaged(spaceId, sinceVersion, "categories", limit, offset);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Get categories error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取分类失败"));
        }
    }

    @PostMapping("/recover")
    public ResponseEntity<ApiResponse<RecoveryResult>> recover(
            @RequestBody RecoveryRequest request) {
        try {
            RecoveryResult result = syncService.recover(
                    request.getSpaceId(), request.getDeviceId(), request.getTargetVersion());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Recover error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("数据恢复失败"));
        }
    }

    // ===== 手动同步端点 =====

    /**
     * 手动创建数据快照（用户主动触发）
     */
    @PostMapping("/snapshot")
    public ResponseEntity<ApiResponse<String>> createSnapshot(
            @RequestParam String spaceId) {
        try {
            snapshotService.createSnapshot(spaceId);
            return ResponseEntity.ok(ApiResponse.success("快照创建成功"));
        } catch (Exception e) {
            log.error("Snapshot creation error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("快照创建失败：" + e.getMessage()));
        }
    }

    /**
     * 手动清理软删除数据（管理员主动触发）
     */
    @PostMapping("/cleanup")
    public ResponseEntity<ApiResponse<String>> cleanup() {
        try {
            dataCleanupService.cleanupSoftDeletedData();
            return ResponseEntity.ok(ApiResponse.success("数据清理成功"));
        } catch (Exception e) {
            log.error("Cleanup error: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("数据清理失败：" + e.getMessage()));
        }
    }
}
