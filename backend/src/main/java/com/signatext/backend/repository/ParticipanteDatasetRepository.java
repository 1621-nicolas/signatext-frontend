package com.signatext.backend.repository;

import com.signatext.backend.entity.ParticipanteDataset;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipanteDatasetRepository extends JpaRepository<ParticipanteDataset, Long> {
    Optional<ParticipanteDataset> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
