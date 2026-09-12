package com.signatext.backend.repository;

import com.signatext.backend.entity.MuestraDataset;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MuestraDatasetRepository extends JpaRepository<MuestraDataset, Long> {
    Optional<MuestraDataset> findByCodigoMuestra(String codigoMuestra);
    boolean existsByCodigoMuestra(String codigoMuestra);
    List<MuestraDataset> findByEtiquetaLabel(String label);
    List<MuestraDataset> findByParticipanteCodigo(String codigo);

    @Query("SELECT COUNT(m) FROM MuestraDataset m WHERE m.etiqueta.label = :label AND m.participante.codigo = :participanteCodigo")
    long countByLabelAndParticipante(String label, String participanteCodigo);

    @Query("SELECT COUNT(DISTINCT m.etiqueta.label) FROM MuestraDataset m")
    long countDistinctLabels();

    @Query("SELECT COUNT(DISTINCT m.participante.codigo) FROM MuestraDataset m")
    long countDistinctParticipants();

    @Query("SELECT COALESCE(SUM(m.totalFrames), 0) FROM MuestraDataset m")
    long sumTotalFrames();
}
