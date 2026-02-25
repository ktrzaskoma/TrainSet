package io.github.ktrzaskoma.cancellation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cancellations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cancellation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String tripId;
    
    @Column(nullable = true)
    private String reasonCode;
    
    private String reason;
    
    @Column(nullable = false)
    private LocalDateTime cancellationDate;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CancellationStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

