package com.signatext.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UnirseSalaRequest(
        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$")
        String codigo
) {
}
