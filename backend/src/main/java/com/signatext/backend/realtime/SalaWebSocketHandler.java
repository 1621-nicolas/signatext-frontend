package com.signatext.backend.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.signatext.backend.dto.MensajeSalaResponse;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class SalaWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ConcurrentMap<String, Set<WebSocketSession>> sesionesPorSala = new ConcurrentHashMap<>();

    public SalaWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String codigo = codigoSala(session);
        if (codigo == null) {
            return;
        }

        sesionesPorSala
                .computeIfAbsent(codigo, key -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        retirarSesion(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        retirarSesion(session);
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    public void publicarMensaje(String codigo, MensajeSalaResponse mensaje) {
        Set<WebSocketSession> sesiones = sesionesPorSala.get(codigo);
        if (sesiones == null || sesiones.isEmpty()) {
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(new SalaRealtimeEvent("MENSAJE", mensaje));
        } catch (Exception exception) {
            return;
        }

        TextMessage textMessage = new TextMessage(payload);

        for (WebSocketSession session : sesiones) {
            if (!session.isOpen()) {
                retirarSesion(session);
                continue;
            }

            try {
                synchronized (session) {
                    session.sendMessage(textMessage);
                }
            } catch (IOException exception) {
                retirarSesion(session);
            }
        }
    }

    private void retirarSesion(WebSocketSession session) {
        String codigo = codigoSala(session);
        if (codigo == null) {
            return;
        }

        Set<WebSocketSession> sesiones = sesionesPorSala.get(codigo);
        if (sesiones == null) {
            return;
        }

        sesiones.remove(session);
        if (sesiones.isEmpty()) {
            sesionesPorSala.remove(codigo);
        }
    }

    private String codigoSala(WebSocketSession session) {
        Object codigo = session.getAttributes().get("codigoSala");
        return codigo instanceof String value ? value : null;
    }
}
