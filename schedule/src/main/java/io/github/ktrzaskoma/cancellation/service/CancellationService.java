package io.github.ktrzaskoma.cancellation.service;

import io.github.ktrzaskoma.cancellation.model.Cancellation;
import io.github.ktrzaskoma.cancellation.model.CancellationReason;
import io.github.ktrzaskoma.cancellation.model.CancellationStatus;
import io.github.ktrzaskoma.cancellation.repository.CancellationRepository;
import io.github.ktrzaskoma.gtfs.model.StopTime;
import io.github.ktrzaskoma.gtfs.repository.StopTimeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CancellationService {
    
    private final CancellationRepository cancellationRepository;
    private final CancellationNotificationService notificationService;
    private final StopTimeRepository stopTimeRepository;
    
    public Cancellation createCancellation(String tripId, String reasonCode, LocalDateTime cancellationDate) {
        log.info("Creating cancellation for trip: {}", tripId);

        List<StopTime> stopTimes = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        
        if (stopTimes.isEmpty()) {
            throw new IllegalArgumentException("Nie znaleziono przejazdu o podanym ID");
        }

        boolean isActive = stopTimes.stream()
                .anyMatch(st -> st.getUpload().getIsActive());
        
        if (!isActive) {
            throw new IllegalArgumentException("Nie znaleziono przejazdu o podanym ID");
        }

        cancellationRepository.findByTripIdAndStatus(tripId, CancellationStatus.ACTIVE)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Przejazd jest już odwołany");
                });

        String resolvedReason = "Nie podano";
        if (reasonCode != null && !reasonCode.isBlank()) {
            try {
                CancellationReason enumReason = CancellationReason.fromCode(reasonCode);
                resolvedReason = enumReason.getDescription();
            } catch (IllegalArgumentException e) {
                log.warn("Invalid reason code: {}", reasonCode);
                throw e;
            }
        }
        
        Cancellation cancellation = Cancellation.builder()
                .tripId(tripId)
                .reasonCode(reasonCode)
                .reason(resolvedReason)
                .cancellationDate(cancellationDate != null ? cancellationDate : LocalDateTime.now())
                .status(CancellationStatus.ACTIVE)
                .build();
        
        Cancellation saved = cancellationRepository.save(cancellation);
        log.info("Cancellation created with ID: {}", saved.getId());
        
        notificationService.sendCancellationNotifications(saved);
        
        return saved;
    }
    
    public Cancellation updateCancellation(Long id, String reasonCode) {
        log.info("Updating cancellation: {}", id);
        
        Cancellation cancellation = cancellationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono odwołania"));

        String resolvedReason = "Nie podano";
        if (reasonCode != null && !reasonCode.isBlank()) {
            try {
                CancellationReason enumReason = CancellationReason.fromCode(reasonCode);
                resolvedReason = enumReason.getDescription();
            } catch (IllegalArgumentException e) {
                log.warn("Invalid reason code: {}", reasonCode);
                throw e;
            }
        }
        
        cancellation.setReasonCode(reasonCode);
        cancellation.setReason(resolvedReason);
        Cancellation updated = cancellationRepository.save(cancellation);

        notificationService.sendCancellationUpdateNotifications(updated);
        
        return updated;
    }
    
    public void reinstateCancellation(Long id) {
        log.info("Reinstating trip for cancellation: {}", id);
        
        Cancellation cancellation = cancellationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono odwołania"));
        
        cancellation.setStatus(CancellationStatus.REINSTATED);
        Cancellation updated = cancellationRepository.save(cancellation);
        
        notificationService.sendReinstateNotifications(updated);
    }
    
    public void deleteCancellation(Long id) {
        log.info("Deleting cancellation: {}", id);
        cancellationRepository.deleteById(id);
    }
    
    public List<Cancellation> getAllCancellations() {
        return cancellationRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Cancellation> getCancellationsByTrip(String tripId) {
        return cancellationRepository.findByTripIdOrderByCreatedAtDesc(tripId);
    }
    
    public List<Cancellation> getActiveCancellations() {
        return cancellationRepository.findByStatusOrderByCreatedAtDesc(CancellationStatus.ACTIVE);
    }
    
    public Cancellation getCancellation(Long id) {
        return cancellationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono odwołania"));
    }
    
    @Transactional(readOnly = true)
    public boolean isTripCancelled(String tripId) {
        return cancellationRepository.findByTripIdAndStatus(tripId, CancellationStatus.ACTIVE).isPresent();
    }
}

