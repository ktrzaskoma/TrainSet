package io.github.ktrzaskoma.delay.service;

import io.github.ktrzaskoma.delay.dto.CreateDelayRequest;
import io.github.ktrzaskoma.delay.dto.DelayDto;
import io.github.ktrzaskoma.delay.dto.UpdateDelayRequest;
import io.github.ktrzaskoma.delay.model.DelayStatus;
import io.github.ktrzaskoma.delay.model.DelayType;
import io.github.ktrzaskoma.delay.model.Delay;
import io.github.ktrzaskoma.delay.repository.DelayRepository;
import io.github.ktrzaskoma.delaynotification.service.DelayNotificationService;
import io.github.ktrzaskoma.gtfs.repository.StopTimeRepository;
import io.github.ktrzaskoma.gtfs.model.StopTime;
import io.github.ktrzaskoma.delay.model.DelayReason;
import io.github.ktrzaskoma.cancellation.service.CancellationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DelayService {

    private final DelayRepository delayRepository;
    private final DelayNotificationService delayNotificationService;
    private final StopTimeRepository stopTimeRepository;
    private final CancellationService cancellationService;

    public DelayDto createDelay(CreateDelayRequest request) {
        log.info("Creating delay for trip: {}, stop: {}, delay: {} minutes", 
                request.getTripId(), request.getStopId(), request.getDelayMinutes());

        if (cancellationService.isTripCancelled(request.getTripId())) {
            throw new IllegalStateException("Wybrane połączenie zostało odwołane. Nie można dodać opóźnienia do odwołanego pociągu.");
        }

        List<Delay> existingDelays = delayRepository.findByTripIdAndStopIdAndStatus(
                request.getTripId(), request.getStopId(), DelayStatus.ACTIVE);
        
        if (!existingDelays.isEmpty()) {
            throw new IllegalStateException("Aktywne opóźnienie już istnieje dla tego przejazdu i przystanku");
        }

        StopTime stopTime = findStopTimeForTripAndStop(request.getTripId(), request.getStopId());
        if (stopTime == null) {
            throw new IllegalArgumentException("Nie znaleziono przystanku dla wybranego przejazdu");
        }

        LocalTime actualDepartureTime = calculateActualTime(stopTime.getDepartureTime(), request.getDelayMinutes());
        LocalTime actualArrivalTime = calculateActualTime(stopTime.getArrivalTime(), request.getDelayMinutes());

        DelayReason delayReason = null;
        String reasonCode = null;
        if (request.getReasonCode() != null && !request.getReasonCode().isEmpty()) {
            try {
                delayReason = DelayReason.fromCode(request.getReasonCode());
                reasonCode = delayReason.getCode();
            } catch (IllegalArgumentException e) {
                log.warn("Unknown delay reason code: {}, using custom reason", request.getReasonCode());
            }
        }

        String finalReason = delayReason != null ? delayReason.getDescription() : "Nie podano przyczyny";

        Delay delay = Delay.builder()
                .tripId(request.getTripId())
                .stopId(request.getStopId())
                .stopSequence(stopTime.getStopSequence())
                .delayMinutes(request.getDelayMinutes())
                .originalDepartureTime(stopTime.getDepartureTime())
                .originalArrivalTime(stopTime.getArrivalTime())
                .actualDepartureTime(actualDepartureTime)
                .actualArrivalTime(actualArrivalTime)
                .delayType(request.getDelayType() != null ? request.getDelayType() : DelayType.BOTH)
                .status(DelayStatus.ACTIVE)
                .reason(finalReason)
                .reasonCode(reasonCode)
                .build();

        delay = delayRepository.save(delay);
        log.info("Delay saved successfully with ID: {}", delay.getId());

        createCascadingDelays(request.getTripId(), request.getStopId(), request.getDelayMinutes(), finalReason, reasonCode);

        try {
            delayNotificationService.sendDelayNotifications(delay);
        } catch (Exception e) {
            log.warn("Failed to send delay notifications, but delay was created successfully: {}", e.getMessage());
        }

        return mapToDto(delay);
    }

    public DelayDto updateDelay(Long delayId, UpdateDelayRequest request) {
        log.info("Updating delay: {}", delayId);

        Delay delay = delayRepository.findById(delayId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono opóźnienia: " + delayId));

        if (delay.getStatus() != DelayStatus.ACTIVE) {
            throw new IllegalStateException("Nie można zaktualizować nieaktywnego opóźnienia");
        }

        delay.setDelayMinutes(request.getDelayMinutes());
        delay.setReason(request.getReason());
        
        delay.setActualDepartureTime(calculateActualTime(delay.getOriginalDepartureTime(), request.getDelayMinutes()));
        delay.setActualArrivalTime(calculateActualTime(delay.getOriginalArrivalTime(), request.getDelayMinutes()));

        delay = delayRepository.save(delay);

        updateCascadingDelays(delay.getTripId(), delay.getStopId(), request.getDelayMinutes(), request.getReason());

        try {
            delayNotificationService.sendDelayUpdateNotifications(delay);
        } catch (Exception e) {
            log.warn("Failed to send delay update notifications, but delay was updated successfully: {}", e.getMessage());
        }

        return mapToDto(delay);
    }

    public void deleteDelay(Long delayId) {
        log.info("Deleting delay: {}", delayId);

        Delay delay = delayRepository.findById(delayId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono opóźnienia: " + delayId));

        if (delay.getStatus() == DelayStatus.ACTIVE) {
            resolveCascadingDelays(delay.getTripId(), delay.getStopId());
        }

        delayRepository.delete(delay);
        log.info("Delay deleted successfully with ID: {}", delayId);
    }

    public void resolveDelay(Long delayId) {
        log.info("Resolving delay: {}", delayId);

        Delay delay = delayRepository.findById(delayId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono opóźnienia: " + delayId));

        if (delay.getStatus() != DelayStatus.ACTIVE) {
            throw new IllegalStateException("Nie można rozwiązać nieaktywnego opóźnienia");
        }

        delay.resolve();
        delayRepository.save(delay);

        resolveCascadingDelays(delay.getTripId(), delay.getStopId());

        try {
            delayNotificationService.sendDelayResolvedNotifications(delay);
        } catch (Exception e) {
            log.warn("Failed to send delay resolved notifications, but delay was resolved successfully: {}", e.getMessage());
        }
    }

    private void createCascadingDelays(String tripId, String initialStopId, Integer delayMinutes, String reason, String reasonCode) {
        List<StopTime> allStops = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        
        int initialStopIndex = -1;
        for (int i = 0; i < allStops.size(); i++) {
            if (allStops.get(i).getStop().getStopId().equals(initialStopId)) {
                initialStopIndex = i;
                break;
            }
        }
        
        if (initialStopIndex == -1) {
            log.warn("Initial stop not found in trip sequence: {}", initialStopId);
            return;
        }

        for (int i = initialStopIndex + 1; i < allStops.size(); i++) {
            StopTime stopTime = allStops.get(i);
            String stopId = stopTime.getStop().getStopId();
            
            List<Delay> existingDelays = delayRepository.findByTripIdAndStopIdAndStatus(
                    tripId, stopId, DelayStatus.ACTIVE);
            
            if (existingDelays.isEmpty()) {
                Delay cascadingDelay = Delay.builder()
                        .tripId(tripId)
                        .stopId(stopId)
                        .stopSequence(stopTime.getStopSequence())
                        .delayMinutes(delayMinutes)
                        .originalDepartureTime(stopTime.getDepartureTime())
                        .originalArrivalTime(stopTime.getArrivalTime())
                        .actualDepartureTime(calculateActualTime(stopTime.getDepartureTime(), delayMinutes))
                        .actualArrivalTime(calculateActualTime(stopTime.getArrivalTime(), delayMinutes))
                        .delayType(DelayType.BOTH)
                        .status(DelayStatus.ACTIVE)
                        .reason("Cascading delay: " + reason)
                        .reasonCode(reasonCode)
                        .build();
                
                delayRepository.save(cascadingDelay);
                log.info("Created cascading delay for stop: {}", stopId);
            }
        }
    }

    private void updateCascadingDelays(String tripId, String initialStopId, Integer newDelayMinutes, String reason) {
        log.info("Updating cascading delays for trip: {}, initial stop: {}, new delay: {} minutes", 
                tripId, initialStopId, newDelayMinutes);
        
        List<StopTime> allStops = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        log.info("Found {} stops for trip: {}", allStops.size(), tripId);
        
        int initialStopIndex = -1;
        for (int i = 0; i < allStops.size(); i++) {
            if (allStops.get(i).getStop().getStopId().equals(initialStopId)) {
                initialStopIndex = i;
                break;
            }
        }
        
        if (initialStopIndex == -1) {
            log.warn("Initial stop not found in trip sequence: {}", initialStopId);
            return;
        }
        
        log.info("Initial stop index: {}, will update {} subsequent stops", 
                initialStopIndex, allStops.size() - initialStopIndex - 1);

        for (int i = initialStopIndex + 1; i < allStops.size(); i++) {
            StopTime stopTime = allStops.get(i);
            String stopId = stopTime.getStop().getStopId();
            
            List<Delay> existingDelays = delayRepository.findByTripIdAndStopIdAndStatus(
                    tripId, stopId, DelayStatus.ACTIVE);
            
            log.info("Found {} active delays for stop: {}", existingDelays.size(), stopId);
            
            for (Delay existingDelay : existingDelays) {
                log.info("Checking delay ID: {}, reason: '{}'", existingDelay.getId(), existingDelay.getReason());
                
                if (existingDelay.getReason() != null && 
                    existingDelay.getReason().startsWith("Cascading delay")) {
                    
                    log.info("Updating cascading delay ID: {} for stop: {}", existingDelay.getId(), stopId);
                    existingDelay.setDelayMinutes(newDelayMinutes);
                    existingDelay.setActualDepartureTime(calculateActualTime(stopTime.getDepartureTime(), newDelayMinutes));
                    existingDelay.setActualArrivalTime(calculateActualTime(stopTime.getArrivalTime(), newDelayMinutes));
                    existingDelay.setReason("Cascading delay: " + reason);
                    
                    delayRepository.save(existingDelay);
                    log.info("Successfully updated cascading delay for stop: {}", stopId);
                } else {
                    log.info("Skipping delay ID: {} - not a cascading delay", existingDelay.getId());
                }
            }
        }
        
        log.info("Finished updating cascading delays for trip: {}", tripId);
    }

    private void resolveCascadingDelays(String tripId, String initialStopId) {
        List<StopTime> allStops = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        
        int initialStopIndex = -1;
        for (int i = 0; i < allStops.size(); i++) {
            if (allStops.get(i).getStop().getStopId().equals(initialStopId)) {
                initialStopIndex = i;
                break;
            }
        }
        
        if (initialStopIndex == -1) {
            return;
        }

        for (int i = initialStopIndex + 1; i < allStops.size(); i++) {
            StopTime stopTime = allStops.get(i);
            String stopId = stopTime.getStop().getStopId();
            
            List<Delay> existingDelays = delayRepository.findByTripIdAndStopIdAndStatus(
                    tripId, stopId, DelayStatus.ACTIVE);
            
            for (Delay existingDelay : existingDelays) {
                if (existingDelay.getReason() != null && 
                    existingDelay.getReason().startsWith("Cascading delay")) {
                    
                    existingDelay.resolve();
                    delayRepository.save(existingDelay);
                    log.info("Resolved cascading delay for stop: {}", stopId);
                }
            }
        }
    }

    private StopTime findStopTimeForTripAndStop(String tripId, String stopId) {
        List<StopTime> stopTimes = stopTimeRepository.findByTripIdOrderByStopSequence(tripId);
        return stopTimes.stream()
                .filter(st -> st.getStop().getStopId().equals(stopId))
                .findFirst()
                .orElse(null);
    }

    private LocalTime calculateActualTime(LocalTime originalTime, Integer delayMinutes) {
        if (originalTime == null || delayMinutes == null) {
            return originalTime;
        }
        return originalTime.plusMinutes(delayMinutes);
    }

    private DelayDto mapToDto(Delay delay) {
        return DelayDto.builder()
                .id(delay.getId())
                .tripId(delay.getTripId())
                .stopId(delay.getStopId())
                .stopSequence(delay.getStopSequence())
                .delayMinutes(delay.getDelayMinutes())
                .originalDepartureTime(delay.getOriginalDepartureTime())
                .originalArrivalTime(delay.getOriginalArrivalTime())
                .actualDepartureTime(delay.getActualDepartureTime())
                .actualArrivalTime(delay.getActualArrivalTime())
                .delayType(delay.getDelayType())
                .status(delay.getStatus())
                .reason(delay.getReason())
                .reasonCode(delay.getReasonCode())
                .createdAt(delay.getCreatedAt())
                .updatedAt(delay.getUpdatedAt())
                .build();
    }
}