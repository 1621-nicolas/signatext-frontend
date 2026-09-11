package com.signatext.backend.realtime;

import com.signatext.backend.entity.ParticipanteSala;
import com.signatext.backend.entity.SalaPrivada;
import com.signatext.backend.entity.Usuario;
import com.signatext.backend.repository.ParticipanteSalaRepository;
import com.signatext.backend.repository.SalaPrivadaRepository;
import com.signatext.backend.repository.UsuarioRepository;
import com.signatext.backend.security.JwtService;
import java.util.Map;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final SalaPrivadaRepository salaRepository;
    private final ParticipanteSalaRepository participanteRepository;

    public JwtWebSocketHandshakeInterceptor(
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            SalaPrivadaRepository salaRepository,
            ParticipanteSalaRepository participanteRepository
    ) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.salaRepository = salaRepository;
        this.participanteRepository = participanteRepository;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        var params = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams();
        String token = params.getFirst("token");
        String codigo = params.getFirst("codigo");

        if (token == null || codigo == null || !codigo.matches("\\d{6}")) {
            return false;
        }

        if (!jwtService.isValid(token)) {
            return false;
        }

        String correo = jwtService.extractCorreo(token);
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo).orElse(null);
        SalaPrivada sala = salaRepository.findByCodigoIgnoreCase(codigo).orElse(null);

        if (usuario == null || sala == null || !Boolean.TRUE.equals(usuario.getEstado())) {
            return false;
        }

        if (!"ACTIVA".equalsIgnoreCase(sala.getEstado())) {
            return false;
        }

        ParticipanteSala participante = participanteRepository.findBySalaAndUsuario(sala, usuario).orElse(null);
        if (participante == null || !Boolean.TRUE.equals(participante.getActivo())) {
            return false;
        }

        attributes.put("codigoSala", sala.getCodigo());
        attributes.put("correo", usuario.getCorreo());
        attributes.put("idUsuario", usuario.getId());
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
    }
}
