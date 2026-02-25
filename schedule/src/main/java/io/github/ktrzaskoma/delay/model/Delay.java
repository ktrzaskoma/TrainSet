package io.github.ktrzaskoma.delay.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "delays")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Delay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private String tripId;

    @Column(name = "stop_id", nullable = false)
    private String stopId;

    @Column(name = "stop_sequence")
    private Integer stopSequence;

    @Column(name = "delay_minutes", nullable = false)
    private Integer delayMinutes;

    @Column(name = "original_departure_time", nullable = false)
    private LocalTime originalDepartureTime;

    @Column(name = "original_arrival_time")
    private LocalTime originalArrivalTime;

    @Column(name = "actual_departure_time")
    private LocalTime actualDepartureTime;

    @Column(name = "actual_arrival_time")
    private LocalTime actualArrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "delay_type", nullable = false)
    private DelayType delayType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DelayStatus status;

    @Column(name = "reason")
    private String reason;

    @Column(name = "reason_code")
    private String reasonCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void resolve() {
        this.status = DelayStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
    }

    public void updateDelay(Integer newDelayMinutes) {
        this.delayMinutes = newDelayMinutes;
        this.updatedAt = LocalDateTime.now();
    }
}

