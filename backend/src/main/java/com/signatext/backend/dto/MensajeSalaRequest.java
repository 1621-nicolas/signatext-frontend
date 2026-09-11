package com.signatext.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensajeSalaRequest(
        @NotBlank
        @Size(max = 1000)
        String contenido,
        String tipo
) {
}
