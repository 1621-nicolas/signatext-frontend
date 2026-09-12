package com.signatext.backend.controller;

import com.signatext.backend.dto.DatasetStatsResponse;
import com.signatext.backend.dto.DatasetUploadRequest;
import com.signatext.backend.dto.MuestraResponse;
import com.signatext.backend.entity.EtiquetaSena;
import com.signatext.backend.service.DatasetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dataset")
public class DatasetController {

    private final DatasetService datasetService;

    public DatasetController(DatasetService datasetService) {
        this.datasetService = datasetService;
    }

    @PostMapping("/upload")
    public ResponseEntity<MuestraResponse> uploadSample(
            @Valid @RequestBody DatasetUploadRequest request
    ) {
        MuestraResponse response = datasetService.uploadSample(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/samples")
    public ResponseEntity<List<MuestraResponse>> listSamples(
            @RequestParam(required = false) String label
    ) {
        List<MuestraResponse> samples;
        if (label != null && !label.isBlank()) {
            samples = datasetService.listSamplesByLabel(label);
        } else {
            samples = datasetService.listSamples();
        }
        return ResponseEntity.ok(samples);
    }

    @GetMapping("/stats")
    public ResponseEntity<DatasetStatsResponse> getStats() {
        return ResponseEntity.ok(datasetService.getStats());
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<EtiquetaSena>> getCatalog() {
        return ResponseEntity.ok(datasetService.getCatalog());
    }

    @DeleteMapping("/samples/{id}")
    public ResponseEntity<Void> deleteSample(@PathVariable Long id) {
        datasetService.deleteSample(id);
        return ResponseEntity.noContent().build();
    }
}
