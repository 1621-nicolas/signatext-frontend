package com.signatext.backend.dto;

public record AuthResponse(
        String token,
        Long idUsuario,
        String nombre,
        String correo
) {
}
