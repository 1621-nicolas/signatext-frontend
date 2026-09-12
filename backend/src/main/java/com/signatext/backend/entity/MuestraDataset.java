package com.signatext.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "muestra_dataset")
public class MuestraDataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_muestra")
    private Long id;

    @Column(name = "codigo_muestra", nullable = false, unique = true, length = 50)
    private String codigoMuestra;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_etiqueta", nullable = false)
    private EtiquetaSena etiqueta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_participante", nullable = false)
    private ParticipanteDataset participante;

    @Column(name = "numero_muestra", nullable = false)
    private Integer numeroMuestra;

    @Column(name = "total_frames", nullable = false)
    private Integer totalFrames = 0;

    @Column(name = "duracion_ms", nullable = false)
    private Integer duracionMs = 0;

    @Column(nullable = false, length = 15)
    private String particion = "TRAIN";

    @Column(nullable = false, length = 15)
    private String estado = "PENDIENTE";

    @Column(length = 20)
    private String resolucion;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "fecha_captura", nullable = false)
    private LocalDateTime fechaCaptura;

    @Column(length = 500)
    private String notas;

    @OneToMany(mappedBy = "muestra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FrameDataset> frames = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (fechaCaptura == null) {
            fechaCaptura = LocalDateTime.now();
        }
        if (particion == null) {
            particion = "TRAIN";
        }
        if (estado == null) {
            estado = "PENDIENTE";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigoMuestra() { return codigoMuestra; }
    public void setCodigoMuestra(String codigoMuestra) { this.codigoMuestra = codigoMuestra; }
    public EtiquetaSena getEtiqueta() { return etiqueta; }
    public void setEtiqueta(EtiquetaSena etiqueta) { this.etiqueta = etiqueta; }
    public ParticipanteDataset getParticipante() { return participante; }
    public void setParticipante(ParticipanteDataset participante) { this.participante = participante; }
    public Integer getNumeroMuestra() { return numeroMuestra; }
    public void setNumeroMuestra(Integer numeroMuestra) { this.numeroMuestra = numeroMuestra; }
    public Integer getTotalFrames() { return totalFrames; }
    public void setTotalFrames(Integer totalFrames) { this.totalFrames = totalFrames; }
    public Integer getDuracionMs() { return duracionMs; }
    public void setDuracionMs(Integer duracionMs) { this.duracionMs = duracionMs; }
    public String getParticion() { return particion; }
    public void setParticion(String particion) { this.particion = particion; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getResolucion() { return resolucion; }
    public void setResolucion(String resolucion) { this.resolucion = resolucion; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public LocalDateTime getFechaCaptura() { return fechaCaptura; }
    public void setFechaCaptura(LocalDateTime fechaCaptura) { this.fechaCaptura = fechaCaptura; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public List<FrameDataset> getFrames() { return frames; }
    public void setFrames(List<FrameDataset> frames) { this.frames = frames; }
}
