package com.signatext.backend.config;

import com.signatext.backend.realtime.JwtWebSocketHandshakeInterceptor;
import com.signatext.backend.realtime.SalaWebSocketHandler;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SalaWebSocketHandler salaWebSocketHandler;
    private final JwtWebSocketHandshakeInterceptor handshakeInterceptor;
    private final String[] allowedOrigins;

    public WebSocketConfig(
            SalaWebSocketHandler salaWebSocketHandler,
            JwtWebSocketHandshakeInterceptor handshakeInterceptor,
            @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        this.salaWebSocketHandler = salaWebSocketHandler;
        this.handshakeInterceptor = handshakeInterceptor;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toArray(String[]::new);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(salaWebSocketHandler, "/ws/salas")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins(allowedOrigins);
    }
}
