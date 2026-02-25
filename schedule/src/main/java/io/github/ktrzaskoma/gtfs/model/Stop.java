package io.github.ktrzaskoma.gtfs.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Stop {

    @Id
    @Column(name = "stop_id")
    private String stopId;

    @Column(name = "stop_name")
    private String stopName;

    @Column(name = "stop_lat", precision = 10, scale = 7)
    private BigDecimal stopLat;

    @Column(name = "stop_lon", precision = 10, scale = 7)
    private BigDecimal stopLon;

    @Column(name = "wheelchair_boarding")
    private Integer wheelchairBoarding;

    @ManyToOne
    @JoinColumn(name = "upload_id")
    private Import upload;
}
