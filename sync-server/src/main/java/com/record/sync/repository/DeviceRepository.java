package com.record.sync.repository;

import com.record.sync.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {

    List<Device> findBySpaceId(String spaceId);

    Optional<Device> findByIdAndSpaceId(String id, String spaceId);
}
