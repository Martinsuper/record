package com.record.sync.repository;

import com.record.sync.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnniversaryRepository extends JpaRepository<Anniversary, String> {

    List<Anniversary> findBySpaceId(String spaceId);

    Optional<Anniversary> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);

    // 新增：查询版本大于指定值的数据
    List<Anniversary> findBySpaceIdAndVersionGreaterThan(String spaceId, Long version);

    // 新增：查询未删除的数据
    List<Anniversary> findBySpaceIdAndDeletedFalse(String spaceId);

    // 新增：物理删除软删除数据
    @Modifying
    @Query("DELETE FROM Anniversary a WHERE a.deleted = true AND a.updatedAt < :threshold")
    void deleteByDeletedTrueAndUpdatedAtBefore(Long threshold);
}
