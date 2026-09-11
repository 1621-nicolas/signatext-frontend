package com.signatext.backend.repository;

import com.signatext.backend.entity.MensajeSala;
import com.signatext.backend.entity.SalaPrivada;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MensajeSalaRepository extends JpaRepository<MensajeSala, Long> {
    List<MensajeSala> findTop100BySalaOrderByFechaAsc(SalaPrivada sala);
}
