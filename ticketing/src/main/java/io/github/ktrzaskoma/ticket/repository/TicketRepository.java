package io.github.ktrzaskoma.ticket.repository;

import io.github.ktrzaskoma.ticket.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByTicketNumber(String ticketNumber);
    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Ticket> findByTripIdAndStatus(String tripId, String status);
}
