package io.github.ktrzaskoma.delay.repository;

import io.github.ktrzaskoma.delay.model.Delay;
import io.github.ktrzaskoma.delay.model.DelayStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DelayRepository extends JpaRepository<Delay, Long> {

    List<Delay> findByTripIdAndStatus(String tripId, DelayStatus status);

    List<Delay> findByStopIdAndStatus(String stopId, DelayStatus status);

    List<Delay> findByStatusOrderByStopSequenceAsc(DelayStatus status);

    @Query("SELECT d FROM Delay d WHERE d.tripId = :tripId AND d.stopId = :stopId AND d.status = :status")
    List<Delay> findByTripIdAndStopIdAndStatus(@Param("tripId") String tripId, 
                                               @Param("stopId") String stopId, 
                                               @Param("status") DelayStatus status);

    @Query("SELECT d FROM Delay d WHERE d.status = 'ACTIVE' AND d.createdAt >= :fromDate")
    List<Delay> findActiveDelaysFromDate(@Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT d FROM Delay d WHERE d.tripId = :tripId AND d.status = 'ACTIVE' ORDER BY d.createdAt DESC")
    List<Delay> findLatestActiveDelayForTrip(@Param("tripId") String tripId);
}
