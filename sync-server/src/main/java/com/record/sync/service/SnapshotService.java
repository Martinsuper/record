package com.record.sync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.record.sync.entity.DataSnapshot;
import com.record.sync.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.GZIPOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class SnapshotService {

    private final EventRepository eventRepository;
    private final AnniversaryRepository anniversaryRepository;
    private final EventTypeRepository eventTypeRepository;
    private final AnniversaryCategoryRepository categoryRepository;
    private final SpaceVersionRepository spaceVersionRepository;
    private final DataSnapshotRepository dataSnapshotRepository;
    private final ObjectMapper objectMapper;

    /**
     * 手动创建快照（由管理员或用户主动触发）
     */
    public void createSnapshots() {
        try {
            List<String> spaceIds = spaceVersionRepository.findAll().stream()
                    .map(sv -> sv.getSpaceId()).distinct().toList();

            for (String spaceId : spaceIds) {
                createSnapshot(spaceId);
            }
        } catch (Exception e) {
            log.error("Snapshot creation error: {}", e.getMessage(), e);
        }
    }

    public void createSnapshot(String spaceId) {
        try {
            Long maxVersion = spaceVersionRepository.getMaxVersion(spaceId);
            if (maxVersion == null || maxVersion == 0L) return;

            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("events", eventRepository.findBySpaceIdAndDeletedFalse(spaceId));
            snapshot.put("anniversaries", anniversaryRepository.findBySpaceIdAndDeletedFalse(spaceId));
            snapshot.put("eventTypes", eventTypeRepository.findBySpaceIdAndDeletedFalse(spaceId));
            snapshot.put("categories", categoryRepository.findBySpaceIdAndDeletedFalse(spaceId));
            snapshot.put("maxVersion", maxVersion);
            snapshot.put("timestamp", System.currentTimeMillis());

            String data = objectMapper.writeValueAsString(snapshot);
            String compressed = compressAndEncode(data);
            String hash = sha256Hex(data);

            // Delete existing snapshot for same version if any
            dataSnapshotRepository.findBySpaceIdAndVersion(spaceId, maxVersion)
                    .ifPresent(existing -> dataSnapshotRepository.deleteById(existing.getId()));

            DataSnapshot dataSnapshot = new DataSnapshot();
            dataSnapshot.setId(UUID.randomUUID().toString().replace("-", ""));
            dataSnapshot.setSpaceId(spaceId);
            dataSnapshot.setVersion(maxVersion);
            dataSnapshot.setDataHash(hash);
            dataSnapshot.setSnapshotData(compressed);
            dataSnapshotRepository.save(dataSnapshot);

            log.info("Created snapshot for space={} version={}", spaceId, maxVersion);

            // Clean old snapshots
            cleanupOldSnapshots(spaceId);
        } catch (Exception e) {
            log.error("Snapshot error for space={}: {}", spaceId, e.getMessage());
        }
    }

    private String compressAndEncode(String data) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (GZIPOutputStream gzip = new GZIPOutputStream(baos)) {
                gzip.write(data.getBytes());
            }
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return data;
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return input.hashCode() + "";
        }
    }

    private void cleanupOldSnapshots(String spaceId) {
        long thirtyDaysAgo = System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000;
        dataSnapshotRepository.deleteOlderThan(spaceId, thirtyDaysAgo);
    }
}
