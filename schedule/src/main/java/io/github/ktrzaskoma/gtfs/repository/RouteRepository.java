package io.github.ktrzaskoma.gtfs.repository;

import io.github.ktrzaskoma.gtfs.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteRepository extends JpaRepository<Route, String> {
}
