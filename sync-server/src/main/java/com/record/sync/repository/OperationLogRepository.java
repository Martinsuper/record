package com.record.sync.repository;
import com.record.sync.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, String> {
    List<OperationLog> findBySpaceIdAndServerVersionGreaterThanOrderByServerVersionAsc(
            String spaceId, Long serverVersion);

    @Query("SELECT MAX(o.serverVersion) FROM OperationLog o WHERE o.spaceId = :spaceId")
    Optional<Long> findMaxServerVersion(@Param("spaceId") String spaceId);

    @Query("SELECT COUNT(o) FROM OperationLog o WHERE o.spaceId = :spaceId AND o.serverVersion > :sinceVersion")
    long countBySpaceIdAndServerVersionGreaterThan(@Param("spaceId") String spaceId,
                                                    @Param("sinceVersion") Long sinceVersion);
}
