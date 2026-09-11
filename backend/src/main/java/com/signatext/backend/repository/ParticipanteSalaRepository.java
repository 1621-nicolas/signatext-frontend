package com.signatext.backend.repository;

import com.signatext.backend.entity.ParticipanteSala;
import com.signatext.backend.entity.SalaPrivada;
import com.signatext.backend.entity.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipanteSalaRepository extends JpaRepository<ParticipanteSala, Long> {
    Optional<ParticipanteSala> findBySalaAndUsuario(SalaPrivada sala, Usuario usuario);
    List<ParticipanteSala> findBySalaAndActivoTrueOrderByFechaIngresoAsc(SalaPrivada sala);
    long countBySalaAndActivoTrue(SalaPrivada sala);
}
