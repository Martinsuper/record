package com.record.sync.controller;

import com.record.sync.dto.*;
import com.record.sync.service.SyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

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
}
