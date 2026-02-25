package io.github.ktrzaskoma.gtfs.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Agency {

    @Id
    private String agencyId;

    @Column(name = "agency_name", nullable = false)
    private String agencyName;

    @Column(name = "agency_url")
    private String agencyUrl;

    @Column(name = "agency_lang", length = 10)
    private String agencyLang;

    @Column(name = "agency_timezone", length = 50)
    private String agencyTimezone;

    @ManyToOne
    @JoinColumn(name = "upload_id")
    private Import upload;
}
