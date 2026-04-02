package com.record.sync.repository;

import com.record.sync.entity.AnniversaryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnniversaryCategoryRepository extends JpaRepository<AnniversaryCategory, String> {

    List<AnniversaryCategory> findBySpaceId(String spaceId);

    Optional<AnniversaryCategory> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);
}
