package com.record.sync.repository;
import com.record.sync.entity.DataSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DataSnapshotRepository extends JpaRepository<DataSnapshot, String> {

    Optional<DataSnapshot> findBySpaceIdAndVersion(String spaceId, Long version);

    List<DataSnapshot> findBySpaceIdAndVersionGreaterThanOrderByVersionAsc(
            String spaceId, Long version);

    @Modifying
    @Query("DELETE FROM DataSnapshot d WHERE d.spaceId = :spaceId AND d.createdAt < :beforeTimestamp")
    void deleteOlderThan(@Param("spaceId") String spaceId,
                         @Param("beforeTimestamp") Long beforeTimestamp);
}
