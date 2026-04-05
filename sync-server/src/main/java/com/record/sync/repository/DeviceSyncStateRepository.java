package com.record.sync.repository;
import com.record.sync.entity.DeviceSyncState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeviceSyncStateRepository extends JpaRepository<DeviceSyncState, String> {
    List<DeviceSyncState> findBySpaceId(String spaceId);
}
