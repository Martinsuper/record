package com.record.sync.service;

import com.record.sync.entity.Space;
import com.record.sync.entity.Device;
import com.record.sync.dto.FullSyncData;
import com.record.sync.dto.SpaceCreateResponse;
import com.record.sync.exception.ShareCodeNotFoundException;
import com.record.sync.repository.*;
import com.record.sync.util.IdGenerator;
import com.record.sync.util.ShareCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final DeviceRepository deviceRepository;
    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository anniversaryCategoryRepository;

    @Transactional
    public SpaceCreateResponse createSpace() {
        String spaceId = IdGenerator.generateSpaceId();
        String shareCode = generateUniqueShareCode();

        Space space = new Space();
        space.setId(spaceId);
        space.setShareCode(shareCode);
        spaceRepository.save(space);

        log.info("Created space: {} with share code: {}", spaceId, shareCode);

        return new SpaceCreateResponse(spaceId, shareCode);
    }

    public Space verifyShareCode(String shareCode) {
        return spaceRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new ShareCodeNotFoundException(shareCode));
    }

    @Transactional
    public Device registerDevice(String spaceId, String deviceId, String deviceName) {
        Optional<Device> existing = deviceRepository.findByIdAndSpaceId(deviceId, spaceId);

        Device device;
        if (existing.isPresent()) {
            device = existing.get();
            device.setLastConnectedAt(LocalDateTime.now());
            if (deviceName != null) {
                device.setDeviceName(deviceName);
            }
        } else {
            device = new Device();
            device.setId(deviceId);
            device.setSpaceId(spaceId);
            device.setDeviceName(deviceName);
        }

        return deviceRepository.save(device);
    }

    public FullSyncData getFullSyncData(String spaceId) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Space not found: " + spaceId));

        return new FullSyncData(
                spaceId,
                space.getShareCode(),
                eventRepository.findBySpaceId(spaceId),
                anniversaryRepository.findBySpaceId(spaceId),
                eventTypeRepository.findBySpaceId(spaceId),
                anniversaryCategoryRepository.findBySpaceId(spaceId)
        );
    }

    @Transactional
    public void updateLastActive(String spaceId) {
        spaceRepository.findById(spaceId).ifPresent(space -> {
            space.setLastActiveAt(LocalDateTime.now());
            spaceRepository.save(space);
        });
    }

    private String generateUniqueShareCode() {
        String code;
        int attempts = 0;
        do {
            code = ShareCodeGenerator.generate();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Failed to generate unique share code after 100 attempts");
            }
        } while (spaceRepository.existsByShareCode(code));
        return code;
    }
}