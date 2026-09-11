package com.signatext.backend.service;

import com.signatext.backend.dto.MensajeSalaRequest;
import com.signatext.backend.dto.MensajeSalaResponse;
import com.signatext.backend.dto.ParticipanteSalaResponse;
import com.signatext.backend.dto.SalaPrivadaResponse;
import com.signatext.backend.entity.MensajeSala;
import com.signatext.backend.entity.ParticipanteSala;
import com.signatext.backend.entity.SalaPrivada;
import com.signatext.backend.entity.Usuario;
import com.signatext.backend.repository.MensajeSalaRepository;
import com.signatext.backend.repository.ParticipanteSalaRepository;
import com.signatext.backend.repository.SalaPrivadaRepository;
import com.signatext.backend.repository.UsuarioRepository;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SalaPrivadaService {

    private final SalaPrivadaRepository salaRepository;
    private final ParticipanteSalaRepository participanteRepository;
    private final MensajeSalaRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final SecureRandom random = new SecureRandom();

    public SalaPrivadaService(
            SalaPrivadaRepository salaRepository,
            ParticipanteSalaRepository participanteRepository,
            MensajeSalaRepository mensajeRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.salaRepository = salaRepository;
        this.participanteRepository = participanteRepository;
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public SalaPrivadaResponse crear(String correo) {
        Usuario usuario = obtenerUsuario(correo);

        SalaPrivada sala = new SalaPrivada();
        sala.setCodigo(generarCodigo());
        sala.setCreador(usuario);
        sala.setEstado("ACTIVA");
        sala = salaRepository.save(sala);

        ParticipanteSala participante = new ParticipanteSala();
        participante.setSala(sala);
        participante.setUsuario(usuario);
        participante.setActivo(true);
        participanteRepository.save(participante);

        return toSalaResponse(sala);
    }

    @Transactional
    public SalaPrivadaResponse unirse(String correo, String codigo) {
        Usuario usuario = obtenerUsuario(correo);
        SalaPrivada sala = obtenerSalaActiva(codigo);

        ParticipanteSala existente = participanteRepository
                .findBySalaAndUsuario(sala, usuario)
                .orElse(null);

        if (existente != null) {
            if (!Boolean.TRUE.equals(existente.getActivo())) {
                if (participanteRepository.countBySalaAndActivoTrue(sala) >= 2) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "La sala ya tiene dos participantes");
                }
                existente.setActivo(true);
                participanteRepository.save(existente);
            }
            return toSalaResponse(sala);
        }

        if (participanteRepository.countBySalaAndActivoTrue(sala) >= 2) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La sala ya tiene dos participantes");
        }

        ParticipanteSala participante = new ParticipanteSala();
        participante.setSala(sala);
        participante.setUsuario(usuario);
        participante.setActivo(true);
        participanteRepository.save(participante);

        return toSalaResponse(sala);
    }

    @Transactional(readOnly = true)
    public SalaPrivadaResponse obtener(String correo, String codigo) {
        Usuario usuario = obtenerUsuario(correo);
        SalaPrivada sala = obtenerSala(codigo);
        validarParticipante(sala, usuario);
        return toSalaResponse(sala);
    }

    @Transactional
    public void salir(String correo, String codigo) {
        Usuario usuario = obtenerUsuario(correo);
        SalaPrivada sala = obtenerSala(codigo);
        ParticipanteSala participante = participanteRepository
                .findBySalaAndUsuario(sala, usuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a esta sala"));

        participante.setActivo(false);
        participanteRepository.save(participante);

        if (participanteRepository.countBySalaAndActivoTrue(sala) == 0) {
            sala.setEstado("CERRADA");
            salaRepository.save(sala);
        }
    }

    @Transactional(readOnly = true)
    public List<MensajeSalaResponse> listarMensajes(String correo, String codigo) {
        Usuario usuario = obtenerUsuario(correo);
        SalaPrivada sala = obtenerSala(codigo);
        validarParticipante(sala, usuario);

        return mensajeRepository.findTop100BySalaOrderByFechaAsc(sala)
                .stream()
                .map(this::toMensajeResponse)
                .toList();
    }

    @Transactional
    public MensajeSalaResponse enviarMensaje(
            String correo,
            String codigo,
            MensajeSalaRequest request
    ) {
        Usuario usuario = obtenerUsuario(correo);
        SalaPrivada sala = obtenerSalaActiva(codigo);
        validarParticipante(sala, usuario);

        String tipo = request.tipo() == null
                ? "TEXTO"
                : request.tipo().trim().toUpperCase(Locale.ROOT);

        if (!tipo.equals("TEXTO") && !tipo.equals("TRADUCCION")) {
            tipo = "TEXTO";
        }

        MensajeSala mensaje = new MensajeSala();
        mensaje.setSala(sala);
        mensaje.setUsuario(usuario);
        mensaje.setTipo(tipo);
        mensaje.setContenido(request.contenido().trim());

        return toMensajeResponse(mensajeRepository.save(mensaje));
    }

    private Usuario obtenerUsuario(String correo) {
        return usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    private SalaPrivada obtenerSala(String codigo) {
        return salaRepository.findByCodigoIgnoreCase(codigo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sala no encontrada"));
    }

    private SalaPrivada obtenerSalaActiva(String codigo) {
        SalaPrivada sala = obtenerSala(codigo);
        if (!"ACTIVA".equalsIgnoreCase(sala.getEstado())) {
            throw new ResponseStatusException(HttpStatus.GONE, "La sala ya no está activa");
        }
        return sala;
    }

    private void validarParticipante(SalaPrivada sala, Usuario usuario) {
        ParticipanteSala participante = participanteRepository
                .findBySalaAndUsuario(sala, usuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a esta sala"));

        if (!Boolean.TRUE.equals(participante.getActivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ya no estás activo en esta sala");
        }
    }

    private String generarCodigo() {
        for (int intento = 0; intento < 30; intento++) {
            String codigo = String.format("%06d", random.nextInt(1_000_000));
            if (!salaRepository.existsByCodigoIgnoreCase(codigo)) {
                return codigo;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo generar el código de sala");
    }

    private SalaPrivadaResponse toSalaResponse(SalaPrivada sala) {
        List<ParticipanteSalaResponse> participantes = participanteRepository
                .findBySalaAndActivoTrueOrderByFechaIngresoAsc(sala)
                .stream()
                .map(participante -> new ParticipanteSalaResponse(
                        participante.getUsuario().getId(),
                        participante.getUsuario().getNombre()
                ))
                .toList();

        return new SalaPrivadaResponse(
                sala.getId(),
                sala.getCodigo(),
                sala.getEstado(),
                sala.getFechaCreacion(),
                participantes
        );
    }

    private MensajeSalaResponse toMensajeResponse(MensajeSala mensaje) {
        return new MensajeSalaResponse(
                mensaje.getId(),
                mensaje.getUsuario().getId(),
                mensaje.getUsuario().getNombre(),
                mensaje.getContenido(),
                mensaje.getTipo(),
                mensaje.getFecha()
        );
    }
}
