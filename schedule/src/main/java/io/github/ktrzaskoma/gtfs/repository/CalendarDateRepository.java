package io.github.ktrzaskoma.gtfs.repository;

import io.github.ktrzaskoma.gtfs.model.CalendarDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendarDateRepository extends JpaRepository<CalendarDate, Long> {
}

