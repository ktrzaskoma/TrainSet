package io.github.ktrzaskoma.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "ticketing.validation")
public class ValidationConfig {
    
    private boolean enabled = true;
    private boolean fallbackToBasic = true;
    private int scheduleServiceTimeout = 5000;
}
