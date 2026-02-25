package io.github.ktrzaskoma.cancellation.controller;

import io.github.ktrzaskoma.cancellation.dto.CancellationRequest;
import io.github.ktrzaskoma.cancellation.dto.CancellationResponse;
import io.github.ktrzaskoma.cancellation.model.Cancellation;
import io.github.ktrzaskoma.cancellation.model.CancellationReason;
import io.github.ktrzaskoma.cancellation.service.CancellationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cancellations")
@RequiredArgsConstructor
@Slf4j
public class CancellationController {
    
    private final CancellationService cancellationService;
    
    @PostMapping
    public ResponseEntity<CancellationResponse> createCancellation(@Valid @RequestBody CancellationRequest request) {
        log.info("Received cancellation request for trip: {}", request.getTripId());
        
        Cancellation cancellation = cancellationService.createCancellation(
                request.getTripId(),
                request.getReasonCode(),
                request.getCancellationDate()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(cancellation));
    }
    
    @GetMapping
    public ResponseEntity<List<CancellationResponse>> getAllCancellations() {
        List<Cancellation> cancellations = cancellationService.getAllCancellations();
        return ResponseEntity.ok(cancellations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<CancellationResponse>> getActiveCancellations() {
        List<Cancellation> cancellations = cancellationService.getActiveCancellations();
        return ResponseEntity.ok(cancellations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CancellationResponse> getCancellation(@PathVariable Long id) {
        Cancellation cancellation = cancellationService.getCancellation(id);
        return ResponseEntity.ok(toResponse(cancellation));
    }
    
    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<CancellationResponse>> getCancellationsByTrip(@PathVariable String tripId) {
        List<Cancellation> cancellations = cancellationService.getCancellationsByTrip(tripId);
        return ResponseEntity.ok(cancellations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }
    
    @GetMapping("/trip/{tripId}/check")
    public ResponseEntity<Boolean> isTripCancelled(@PathVariable String tripId) {
        return ResponseEntity.ok(cancellationService.isTripCancelled(tripId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CancellationResponse> updateCancellation(
            @PathVariable Long id,
            @Valid @RequestBody CancellationRequest request) {
        log.info("Updating cancellation: {}", id);
        
        Cancellation updated = cancellationService.updateCancellation(id, request.getReasonCode());
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @PutMapping("/{id}/reinstate")
    public ResponseEntity<Void> reinstateCancellation(@PathVariable Long id) {
        log.info("Reinstating trip for cancellation: {}", id);
        cancellationService.reinstateCancellation(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCancellation(@PathVariable Long id) {
        log.info("Deleting cancellation: {}", id);
        cancellationService.deleteCancellation(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/reasons")
    public ResponseEntity<List<CancellationReason>> getCancellationReasons() {
        return ResponseEntity.ok(Arrays.asList(CancellationReason.values()));
    }
    
    private CancellationResponse toResponse(Cancellation cancellation) {
        return CancellationResponse.builder()
                .id(cancellation.getId())
                .tripId(cancellation.getTripId())
                .reasonCode(cancellation.getReasonCode())
                .reason(cancellation.getReason())
                .cancellationDate(cancellation.getCancellationDate())
                .status(cancellation.getStatus())
                .createdAt(cancellation.getCreatedAt())
                .updatedAt(cancellation.getUpdatedAt())
                .build();
    }
}

