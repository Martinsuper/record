package com.record.sync.repository;

import com.record.sync.entity.SpaceVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceVersionRepository extends JpaRepository<SpaceVersion, String> {

    @Query("SELECT sv.maxVersion FROM SpaceVersion sv WHERE sv.spaceId = :spaceId")
    Long getMaxVersion(String spaceId);

    @Modifying
    @Query("UPDATE SpaceVersion sv SET sv.maxVersion = :version, sv.updatedAt = :updatedAt WHERE sv.spaceId = :spaceId")
    void updateMaxVersion(String spaceId, Long version, Long updatedAt);

    @Modifying
    @Query("INSERT INTO SpaceVersion (spaceId, maxVersion, updatedAt) VALUES (:spaceId, 0, :updatedAt) ON DUPLICATE KEY UPDATE updatedAt = :updatedAt")
    void initSpaceVersion(String spaceId, Long updatedAt);
}
