package io.github.ktrzaskoma.delay.service;

import io.github.ktrzaskoma.delay.dto.DelayDto;
import io.github.ktrzaskoma.delay.model.Delay;
import io.github.ktrzaskoma.delay.repository.DelayRepository;
import io.github.ktrzaskoma.delay.model.DelayStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DelayQueryService {

    private final DelayRepository delayRepository;

    public List<DelayDto> getActiveDelays() {
        List<Delay> delays = delayRepository.findByStatusOrderByStopSequenceAsc(DelayStatus.ACTIVE);
        System.out.println("Found " + delays.size() + " active delays in database");
        return delays.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DelayDto> getDelaysByTrip(String tripId) {
        return delayRepository.findByTripIdAndStatus(tripId, DelayStatus.ACTIVE)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DelayDto> getDelaysByStop(String stopId) {
        return delayRepository.findByStopIdAndStatus(stopId, DelayStatus.ACTIVE)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DelayDto> getRecentDelays(int hours) {
        LocalDateTime fromDate = LocalDateTime.now().minusHours(hours);
        return delayRepository.findActiveDelaysFromDate(fromDate)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DelayDto getLatestDelayForTrip(String tripId) {
        return delayRepository.findLatestActiveDelayForTrip(tripId)
                .stream()
                .findFirst()
                .map(this::mapToDto)
                .orElse(null);
    }

    private DelayDto mapToDto(Delay delay) {
        return DelayDto.builder()
                .id(delay.getId())
                .tripId(delay.getTripId())
                .stopId(delay.getStopId())
                .stopSequence(delay.getStopSequence())
                .stopName("")
                .routeShortName("")
                .delayMinutes(delay.getDelayMinutes())
                .originalDepartureTime(delay.getOriginalDepartureTime())
                .originalArrivalTime(delay.getOriginalArrivalTime())
                .actualDepartureTime(delay.getActualDepartureTime())
                .actualArrivalTime(delay.getActualArrivalTime())
                .delayType(delay.getDelayType())
                .status(delay.getStatus())
                .reason(delay.getReason())
                .reasonCode(delay.getReasonCode())
                .reasonDescription("")
                .createdAt(delay.getCreatedAt())
                .updatedAt(delay.getUpdatedAt())
                .resolvedAt(delay.getResolvedAt())
                .build();
    }
}
