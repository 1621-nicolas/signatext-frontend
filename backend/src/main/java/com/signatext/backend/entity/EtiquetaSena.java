package com.signatext.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "etiqueta_sena")
public class EtiquetaSena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_etiqueta")
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String label;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, length = 200)
    private String descripcion;

    @Column(name = "es_estatica", nullable = false)
    private Boolean esEstatica = true;

    @Column(name = "requiere_dos_manos", nullable = false)
    private Boolean requiereDosManos = false;

    @Column(name = "notas_referencia", length = 500)
    private String notasReferencia;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersist() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (esEstatica == null) {
            esEstatica = true;
        }
        if (requiereDosManos == null) {
            requiereDosManos = false;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Boolean getEsEstatica() { return esEstatica; }
    public void setEsEstatica(Boolean esEstatica) { this.esEstatica = esEstatica; }
    public Boolean getRequiereDosManos() { return requiereDosManos; }
    public void setRequiereDosManos(Boolean requiereDosManos) { this.requiereDosManos = requiereDosManos; }
    public String getNotasReferencia() { return notasReferencia; }
    public void setNotasReferencia(String notasReferencia) { this.notasReferencia = notasReferencia; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
