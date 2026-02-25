package io.github.ktrzaskoma.cancellation.repository;

import io.github.ktrzaskoma.cancellation.model.Cancellation;
import io.github.ktrzaskoma.cancellation.model.CancellationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CancellationRepository extends JpaRepository<Cancellation, Long> {

    List<Cancellation> findByTripIdOrderByCreatedAtDesc(String tripId);

    List<Cancellation> findByStatusOrderByCreatedAtDesc(CancellationStatus status);

    Optional<Cancellation> findByTripIdAndStatus(String tripId, CancellationStatus status);

    List<Cancellation> findAllByOrderByCreatedAtDesc();
}








