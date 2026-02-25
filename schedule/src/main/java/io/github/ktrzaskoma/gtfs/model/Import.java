package io.github.ktrzaskoma.gtfs.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Import {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filename")
    private String filename;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "upload_date")
    private LocalDateTime uploadDate;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @PrePersist
    protected void onCreate() {
        uploadDate = LocalDateTime.now();
        if (isActive == null) {
            isActive = false;
        }
    }
}
