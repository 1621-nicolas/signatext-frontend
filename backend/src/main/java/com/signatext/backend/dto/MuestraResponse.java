package com.signatext.backend.dto;

public class MuestraResponse {

    private Long id;
    private String codigoMuestra;
    private String label;
    private String categoria;
    private String participantId;
    private String dominantHand;
    private Integer sampleNumber;
    private Integer totalFrames;
    private Integer durationMs;
    private String particion;
    private String estado;
    private String fechaCaptura;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigoMuestra() { return codigoMuestra; }
    public void setCodigoMuestra(String codigoMuestra) { this.codigoMuestra = codigoMuestra; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getParticipantId() { return participantId; }
    public void setParticipantId(String participantId) { this.participantId = participantId; }
    public String getDominantHand() { return dominantHand; }
    public void setDominantHand(String dominantHand) { this.dominantHand = dominantHand; }
    public Integer getSampleNumber() { return sampleNumber; }
    public void setSampleNumber(Integer sampleNumber) { this.sampleNumber = sampleNumber; }
    public Integer getTotalFrames() { return totalFrames; }
    public void setTotalFrames(Integer totalFrames) { this.totalFrames = totalFrames; }
    public Integer getDurationMs() { return durationMs; }
    public void setDurationMs(Integer durationMs) { this.durationMs = durationMs; }
    public String getParticion() { return particion; }
    public void setParticion(String particion) { this.particion = particion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getFechaCaptura() { return fechaCaptura; }
    public void setFechaCaptura(String fechaCaptura) { this.fechaCaptura = fechaCaptura; }
}
