package io.github.ktrzaskoma.gtfs.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class CalendarDate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_id", length = 50)
    private String serviceId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "exception_type")
    private Integer exceptionType;

    @ManyToOne
    @JoinColumn(name = "upload_id")
    private Import upload;
}
