package io.github.ktrzaskoma;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class TicketingDelayIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testTicketDelayEndpoints() throws Exception {
        mockMvc.perform(get("/ticket/test-ticket-123/delays"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketNumber").value("test-ticket-123"))
                .andExpect(jsonPath("$.hasDelay").value(false))
                .andExpect(jsonPath("$.delayMinutes").value(0));
    }

    @Test
    void testTicketEndpoints() throws Exception {
        mockMvc.perform(get("/ticket/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Ticketing service is running"));
    }

    @Test
    void testTicketValidation() throws Exception {
        // Test walidacji biletu
        mockMvc.perform(get("/ticket/validate/non-existent-ticket"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
}
