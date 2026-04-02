package com.record.sync.repository;

import com.record.sync.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpaceRepository extends JpaRepository<Space, String> {

    Optional<Space> findByShareCode(String shareCode);

    boolean existsByShareCode(String shareCode);
}
