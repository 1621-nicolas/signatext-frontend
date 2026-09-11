package com.signatext.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SalaPrivadaResponse(
        Long idSala,
        String codigo,
        String estado,
        LocalDateTime fechaCreacion,
        List<ParticipanteSalaResponse> participantes
) {
}
