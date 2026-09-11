package com.signatext.backend.repository;

import com.signatext.backend.entity.SalaPrivada;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalaPrivadaRepository extends JpaRepository<SalaPrivada, Long> {
    Optional<SalaPrivada> findByCodigoIgnoreCase(String codigo);
    boolean existsByCodigoIgnoreCase(String codigo);
}
