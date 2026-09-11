package com.signatext.backend.controller;

import com.signatext.backend.dto.MensajeSalaRequest;
import com.signatext.backend.dto.MensajeSalaResponse;
import com.signatext.backend.dto.SalaPrivadaResponse;
import com.signatext.backend.dto.UnirseSalaRequest;
import com.signatext.backend.service.SalaPrivadaService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/salas")
public class SalaPrivadaController {

    private final SalaPrivadaService salaService;

    public SalaPrivadaController(SalaPrivadaService salaService) {
        this.salaService = salaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalaPrivadaResponse crear(Principal principal) {
        return salaService.crear(principal.getName());
    }

    @PostMapping("/unirse")
    public SalaPrivadaResponse unirse(
            Principal principal,
            @Valid @RequestBody UnirseSalaRequest request
    ) {
        return salaService.unirse(principal.getName(), request.codigo());
    }

    @GetMapping("/{codigo}")
    public SalaPrivadaResponse obtener(
            Principal principal,
            @PathVariable String codigo
    ) {
        return salaService.obtener(principal.getName(), codigo);
    }

    @PostMapping("/{codigo}/salir")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void salir(
            Principal principal,
            @PathVariable String codigo
    ) {
        salaService.salir(principal.getName(), codigo);
    }

    @GetMapping("/{codigo}/mensajes")
    public List<MensajeSalaResponse> listarMensajes(
            Principal principal,
            @PathVariable String codigo
    ) {
        return salaService.listarMensajes(principal.getName(), codigo);
    }

    @PostMapping("/{codigo}/mensajes")
    @ResponseStatus(HttpStatus.CREATED)
    public MensajeSalaResponse enviarMensaje(
            Principal principal,
            @PathVariable String codigo,
            @Valid @RequestBody MensajeSalaRequest request
    ) {
        return salaService.enviarMensaje(principal.getName(), codigo, request);
    }
}
