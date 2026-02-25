package io.github.ktrzaskoma.gtfs.repository;

import io.github.ktrzaskoma.gtfs.model.StopTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface StopTimeRepository extends JpaRepository<StopTime, Long> {

    @Query("""
        SELECT st FROM StopTime st
        JOIN FETCH st.trip t
        JOIN FETCH t.route r
        JOIN FETCH st.stop s
        WHERE st.stop.stopId = :fromStopId
        AND st.departureTime >= :departureTime
        AND st.upload.isActive = true
        AND EXISTS (
            SELECT 1 FROM StopTime st2
            WHERE st2.trip = t
            AND st2.stop.stopId = :toStopId
            AND st2.stopSequence > st.stopSequence
        ) AND EXISTS (
            SELECT 1 FROM CalendarDate cd
            WHERE cd.serviceId = t.serviceId
            AND cd.date = :travelDate
            AND cd.upload.isActive = true
        ) AND st.id IN (
            SELECT MIN(st3.id) FROM StopTime st3
            JOIN st3.trip t3
            WHERE st3.stop.stopId = :fromStopId
            AND st3.departureTime >= :departureTime
            AND st3.upload.isActive = true
            AND EXISTS (
                SELECT 1 FROM StopTime st4
                WHERE st4.trip = t3
                AND st4.stop.stopId = :toStopId
                AND st4.stopSequence > st3.stopSequence
            ) AND EXISTS (
                SELECT 1 FROM CalendarDate cd2
                WHERE cd2.serviceId = t3.serviceId
                AND cd2.date = :travelDate
                AND cd2.upload.isActive = true
            ) GROUP BY st3.departureTime, st3.arrivalTime
        ) ORDER BY st.departureTime
        """)
    List<StopTime> findConnections(@Param("fromStopId") String fromStopId,
                                   @Param("toStopId") String toStopId,
                                   @Param("departureTime") LocalTime departureTime,
                                   @Param("travelDate") LocalDate travelDate);

    @Query("""
        SELECT CASE WHEN COUNT(st) > 0 THEN TRUE ELSE FALSE END
        FROM StopTime st
        JOIN st.trip t
        WHERE t.tripId = :tripId
          AND st.stop.stopId = :fromStopId
          AND st.upload.isActive = true
          AND EXISTS (
              SELECT 1 FROM StopTime st2
              WHERE st2.trip = t
                AND st2.stop.stopId = :toStopId
                AND st2.stopSequence > st.stopSequence
          )
          AND EXISTS (
              SELECT 1 FROM CalendarDate cd
              WHERE cd.serviceId = t.serviceId
              AND cd.date = :travelDate
              AND cd.upload.isActive = true
          )
        """)
    boolean existsConnectionForTripOnDate(@Param("tripId") String tripId,
                                          @Param("fromStopId") String fromStopId,
                                          @Param("toStopId") String toStopId,
                                          @Param("travelDate") LocalDate travelDate);

    @Query("""
        SELECT st FROM StopTime st
        JOIN FETCH st.trip t
        JOIN FETCH st.stop s
        WHERE t.tripId = :tripId
        AND st.upload.isActive = true
        ORDER BY st.stopSequence
        """)
    List<StopTime> findByTripIdOrderByStopSequence(@Param("tripId") String tripId);

    @Query("""
        SELECT st FROM StopTime st
        JOIN FETCH st.trip t
        JOIN FETCH st.stop s
        WHERE t.tripId = :tripId
        AND st.stop.stopId = :stopId
        AND st.upload.isActive = true
        """)
    java.util.Optional<StopTime> findByTripIdAndStopId(@Param("tripId") String tripId, @Param("stopId") String stopId);

    @Query("""
        SELECT st FROM StopTime st
        JOIN FETCH st.trip t
        JOIN FETCH st.stop s
        WHERE t.tripId = :tripId
        AND st.stop.stopId = :toStopId
        AND st.stopSequence > :fromStopSequence
        AND st.upload.isActive = true
        ORDER BY st.stopSequence
        """)
    java.util.Optional<StopTime> findArrivalStopTime(@Param("tripId") String tripId, 
                                                     @Param("toStopId") String toStopId, 
                                                     @Param("fromStopSequence") Integer fromStopSequence);
}
