package com.signatext.backend.service;

import com.signatext.backend.dto.AuthResponse;
import com.signatext.backend.dto.LoginRequest;
import com.signatext.backend.dto.RegistroRequest;
import com.signatext.backend.entity.Usuario;
import com.signatext.backend.repository.UsuarioRepository;
import com.signatext.backend.security.JwtService;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse registrar(RegistroRequest request) {
        String correo = normalizarCorreo(request.correo());

        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setEstado(true);

        Usuario guardado = usuarioRepository.save(usuario);
        String token = jwtService.generateToken(guardado.getCorreo());

        return new AuthResponse(
                token,
                guardado.getId(),
                guardado.getNombre(),
                guardado.getCorreo()
        );
    }

    public AuthResponse login(LoginRequest request) {
        String correo = normalizarCorreo(request.correo());

        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Correo o contraseña incorrectos"
                ));

        if (!Boolean.TRUE.equals(usuario.getEstado()) ||
                !passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Correo o contraseña incorrectos"
            );
        }

        String token = jwtService.generateToken(usuario.getCorreo());

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo()
        );
    }

    private String normalizarCorreo(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
