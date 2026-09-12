package com.signatext.backend.repository;

import com.signatext.backend.entity.EtiquetaSena;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EtiquetaSenaRepository extends JpaRepository<EtiquetaSena, Long> {
    Optional<EtiquetaSena> findByLabel(String label);
    List<EtiquetaSena> findByCategoria(String categoria);
    boolean existsByLabel(String label);
}
