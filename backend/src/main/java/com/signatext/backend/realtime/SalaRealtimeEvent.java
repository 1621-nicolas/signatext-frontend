package com.signatext.backend.realtime;

import com.signatext.backend.dto.MensajeSalaResponse;

public record SalaRealtimeEvent(
        String tipo,
        MensajeSalaResponse mensaje
) {
}
