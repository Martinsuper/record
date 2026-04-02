package com.record.sync.controller;

import com.record.sync.dto.ApiResponse;
import com.record.sync.dto.FullSyncData;
import com.record.sync.dto.SpaceCreateResponse;
import com.record.sync.entity.Space;
import com.record.sync.service.SpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/space")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    /**
     * 创建新空间
     */
    @PostMapping("/create")
    public ApiResponse<SpaceCreateResponse> createSpace() {
        SpaceCreateResponse response = spaceService.createSpace();
        return ApiResponse.success(response);
    }

    /**
     * 验证共享码
     * @param code 共享码
     */
    @GetMapping("/verify")
    public ApiResponse<SpaceCreateResponse> verifyShareCode(@RequestParam String code) {
        Space space = spaceService.verifyShareCode(code);
        return ApiResponse.success(new SpaceCreateResponse(space.getId(), space.getShareCode()));
    }

    /**
     * 获取空间全量数据
     * @param spaceId 空间 ID
     */
    @GetMapping("/{spaceId}/data")
    public ApiResponse<FullSyncData> getFullSyncData(@PathVariable String spaceId) {
        FullSyncData data = spaceService.getFullSyncData(spaceId);
        return ApiResponse.success(data);
    }
}
