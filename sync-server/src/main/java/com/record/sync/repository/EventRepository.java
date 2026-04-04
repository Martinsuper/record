package com.record.sync.repository;

import com.record.sync.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {

    List<Event> findBySpaceId(String spaceId);

    Optional<Event> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据（增量同步）
    List<Event> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据（全量同步）
    List<Event> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除超过指定时间的软删除数据
    @Modifying
    @Query("DELETE FROM Event e WHERE e.deleted = true AND e.updatedAt < :threshold")
    void deleteByDeletedTrueAndUpdatedAtBefore(Long threshold);
}
