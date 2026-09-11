package com.signatext.backend.dto;

import java.time.LocalDateTime;

public record MensajeSalaResponse(
        Long idMensaje,
        Long idUsuario,
        String nombre,
        String contenido,
        String tipo,
        LocalDateTime fecha
) {
}
