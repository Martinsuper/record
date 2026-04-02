package com.record.sync.repository;

import com.record.sync.entity.Anniversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnniversaryRepository extends JpaRepository<Anniversary, String> {

    List<Anniversary> findBySpaceId(String spaceId);

    Optional<Anniversary> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);
}
