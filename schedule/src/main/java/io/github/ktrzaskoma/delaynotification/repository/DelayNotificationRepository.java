package io.github.ktrzaskoma.delaynotification.repository;

import io.github.ktrzaskoma.delaynotification.model.NotificationStatus;
import io.github.ktrzaskoma.delaynotification.model.DelayNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DelayNotificationRepository extends JpaRepository<DelayNotification, Long> {

    List<DelayNotification> findByDelayIdAndStatus(Long delayId, NotificationStatus status);

    List<DelayNotification> findByUserIdAndStatus(Long userId, NotificationStatus status);

    @Query("SELECT dn FROM DelayNotification dn WHERE dn.delay.tripId = :tripId AND dn.status = :status")
    List<DelayNotification> findByTripIdAndStatus(@Param("tripId") String tripId,
                                                  @Param("status") NotificationStatus status);

    @Query("SELECT dn FROM DelayNotification dn WHERE dn.delay.stopId = :stopId AND dn.status = :status")
    List<DelayNotification> findByStopIdAndStatus(@Param("stopId") String stopId,
                                                  @Param("status") NotificationStatus status);
}



