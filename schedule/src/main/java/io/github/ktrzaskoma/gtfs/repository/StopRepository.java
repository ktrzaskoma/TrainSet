package io.github.ktrzaskoma.gtfs.repository;

import io.github.ktrzaskoma.gtfs.model.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StopRepository extends JpaRepository<Stop, String> {
    List<Stop> findByUploadIsActiveTrue();
    Stop findByStopId(String stopId);
}
