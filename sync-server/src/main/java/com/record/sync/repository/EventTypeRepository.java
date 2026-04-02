package com.record.sync.repository;

import com.record.sync.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventTypeRepository extends JpaRepository<EventType, String> {

    List<EventType> findBySpaceId(String spaceId);

    Optional<EventType> findByIdAndSpaceId(String id, String spaceId);

    void deleteByIdAndSpaceId(String id, String spaceId);
}
