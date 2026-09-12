package com.signatext.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.signatext.backend.dto.DatasetFrameDto;
import com.signatext.backend.dto.DatasetStatsResponse;
import com.signatext.backend.dto.DatasetUploadRequest;
import com.signatext.backend.dto.MuestraResponse;
import com.signatext.backend.entity.EtiquetaSena;
import com.signatext.backend.entity.FrameDataset;
import com.signatext.backend.entity.MuestraDataset;
import com.signatext.backend.entity.ParticipanteDataset;
import com.signatext.backend.repository.EtiquetaSenaRepository;
import com.signatext.backend.repository.MuestraDatasetRepository;
import com.signatext.backend.repository.ParticipanteDatasetRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DatasetService {

    private final EtiquetaSenaRepository etiquetaRepo;
    private final ParticipanteDatasetRepository participanteRepo;
    private final MuestraDatasetRepository muestraRepo;
    private final ObjectMapper objectMapper;

    public DatasetService(
            EtiquetaSenaRepository etiquetaRepo,
            ParticipanteDatasetRepository participanteRepo,
            MuestraDatasetRepository muestraRepo,
            ObjectMapper objectMapper
    ) {
        this.etiquetaRepo = etiquetaRepo;
        this.participanteRepo = participanteRepo;
        this.muestraRepo = muestraRepo;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MuestraResponse uploadSample(DatasetUploadRequest request) {
        String label = request.getLabel().trim().toUpperCase();
        String participantCode = request.getParticipantId().trim().toUpperCase();

        EtiquetaSena etiqueta = etiquetaRepo.findByLabel(label)
                .orElseGet(() -> {
                    EtiquetaSena nueva = new EtiquetaSena();
                    nueva.setLabel(label);
                    nueva.setCategoria("Otros");
                    nueva.setDescripcion("Etiqueta creada automáticamente");
                    nueva.setEsEstatica(true);
                    nueva.setRequiereDosManos(false);
                    return etiquetaRepo.save(nueva);
                });

        ParticipanteDataset participante = participanteRepo.findByCodigo(participantCode)
                .orElseGet(() -> {
                    ParticipanteDataset nuevo = new ParticipanteDataset();
                    nuevo.setCodigo(participantCode);
                    nuevo.setManoDominante(
                            request.getDominantHand() != null ? request.getDominantHand() : "DERECHA"
                    );
                    nuevo.setConsentimiento(true);
                    return participanteRepo.save(nuevo);
                });

        long existingCount = muestraRepo.countByLabelAndParticipante(label, participantCode);
        int sampleNumber = request.getSampleNumber() != null
                ? request.getSampleNumber()
                : (int) existingCount + 1;

        String codigoMuestra = label + "_" + participantCode + "_" + String.format("%03d", sampleNumber);

        if (muestraRepo.existsByCodigoMuestra(codigoMuestra)) {
            sampleNumber = (int) existingCount + 1;
            codigoMuestra = label + "_" + participantCode + "_" + String.format("%03d", sampleNumber);
        }

        MuestraDataset muestra = new MuestraDataset();
        muestra.setCodigoMuestra(codigoMuestra);
        muestra.setEtiqueta(etiqueta);
        muestra.setParticipante(participante);
        muestra.setNumeroMuestra(sampleNumber);
        muestra.setDuracionMs(request.getDurationMs() != null ? request.getDurationMs() : 0);
        muestra.setResolucion(request.getResolution());
        muestra.setUserAgent(request.getUserAgent());

        List<DatasetFrameDto> frameDtos = request.getFrames();
        int index = 0;
        for (DatasetFrameDto dto : frameDtos) {
            FrameDataset frame = new FrameDataset();
            frame.setMuestra(muestra);
            frame.setIndiceFrame(index);
            frame.setTimestampMs(dto.getTimestamp() != null ? dto.getTimestamp() : 0);
            frame.setManoIzquierda(serializeHand(dto.getLeftHand()));
            frame.setConfianzaIzquierda(dto.getLeftHandedness() != null ? dto.getLeftHandedness() : 0.0);
            frame.setManoDerecha(serializeHand(dto.getRightHand()));
            frame.setConfianzaDerecha(dto.getRightHandedness() != null ? dto.getRightHandedness() : 0.0);
            muestra.getFrames().add(frame);
            index++;
        }

        muestra.setTotalFrames(frameDtos.size());
        MuestraDataset saved = muestraRepo.save(muestra);

        return toResponse(saved);
    }

    public List<MuestraResponse> listSamples() {
        return muestraRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MuestraResponse> listSamplesByLabel(String label) {
        return muestraRepo.findByEtiquetaLabel(label.trim().toUpperCase()).stream()
                .map(this::toResponse)
                .toList();
    }

    public DatasetStatsResponse getStats() {
        long totalSamples = muestraRepo.count();
        long totalFrames = muestraRepo.sumTotalFrames();
        long uniqueLabels = muestraRepo.countDistinctLabels();
        long uniqueParticipants = muestraRepo.countDistinctParticipants();

        return new DatasetStatsResponse(totalSamples, totalFrames, uniqueLabels, uniqueParticipants);
    }

    @Transactional
    public void deleteSample(Long id) {
        muestraRepo.deleteById(id);
    }

    public List<EtiquetaSena> getCatalog() {
        return etiquetaRepo.findAll();
    }

    private MuestraResponse toResponse(MuestraDataset m) {
        MuestraResponse r = new MuestraResponse();
        r.setId(m.getId());
        r.setCodigoMuestra(m.getCodigoMuestra());
        r.setLabel(m.getEtiqueta().getLabel());
        r.setCategoria(m.getEtiqueta().getCategoria());
        r.setParticipantId(m.getParticipante().getCodigo());
        r.setDominantHand(m.getParticipante().getManoDominante());
        r.setSampleNumber(m.getNumeroMuestra());
        r.setTotalFrames(m.getTotalFrames());
        r.setDurationMs(m.getDuracionMs());
        r.setParticion(m.getParticion());
        r.setEstado(m.getEstado());
        r.setFechaCaptura(m.getFechaCaptura() != null ? m.getFechaCaptura().toString() : "");
        return r;
    }

    private String serializeHand(List<Double> hand) {
        if (hand == null || hand.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(hand);
        } catch (JsonProcessingException e) {
            return hand.toString();
        }
    }
}
