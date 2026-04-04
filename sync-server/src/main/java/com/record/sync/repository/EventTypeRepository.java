package com.record.sync.repository;

import com.record.sync.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventTypeRepository extends JpaRepository<EventType, String> {

    List<EventType> findBySpaceId(String spaceId);

    Optional<EventType> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据
    List<EventType> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据
    List<EventType> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除软删除数据
    @Modifying
    @Query("DELETE FROM EventType et WHERE et.deleted = true AND et.createdAt < :threshold")
    void deleteByDeletedTrueAndCreatedAtBefore(Long threshold);
}
