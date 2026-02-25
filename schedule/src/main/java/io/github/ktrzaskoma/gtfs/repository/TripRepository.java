package io.github.ktrzaskoma.gtfs.repository;

import io.github.ktrzaskoma.gtfs.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripRepository extends JpaRepository<Trip, String> {
}
