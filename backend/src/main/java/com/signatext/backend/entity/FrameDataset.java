package com.signatext.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "frame_dataset")
public class FrameDataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_frame")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_muestra", nullable = false)
    private MuestraDataset muestra;

    @Column(name = "indice_frame", nullable = false)
    private Integer indiceFrame;

    @Column(name = "timestamp_ms", nullable = false)
    private Integer timestampMs;

    @Column(name = "mano_izquierda", columnDefinition = "NVARCHAR(MAX)")
    private String manoIzquierda;

    @Column(name = "confianza_izquierda", nullable = false)
    private Double confianzaIzquierda = 0.0;

    @Column(name = "mano_derecha", columnDefinition = "NVARCHAR(MAX)")
    private String manoDerecha;

    @Column(name = "confianza_derecha", nullable = false)
    private Double confianzaDerecha = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MuestraDataset getMuestra() { return muestra; }
    public void setMuestra(MuestraDataset muestra) { this.muestra = muestra; }
    public Integer getIndiceFrame() { return indiceFrame; }
    public void setIndiceFrame(Integer indiceFrame) { this.indiceFrame = indiceFrame; }
    public Integer getTimestampMs() { return timestampMs; }
    public void setTimestampMs(Integer timestampMs) { this.timestampMs = timestampMs; }
    public String getManoIzquierda() { return manoIzquierda; }
    public void setManoIzquierda(String manoIzquierda) { this.manoIzquierda = manoIzquierda; }
    public Double getConfianzaIzquierda() { return confianzaIzquierda; }
    public void setConfianzaIzquierda(Double confianzaIzquierda) { this.confianzaIzquierda = confianzaIzquierda; }
    public String getManoDerecha() { return manoDerecha; }
    public void setManoDerecha(String manoDerecha) { this.manoDerecha = manoDerecha; }
    public Double getConfianzaDerecha() { return confianzaDerecha; }
    public void setConfianzaDerecha(Double confianzaDerecha) { this.confianzaDerecha = confianzaDerecha; }
}
