package com.signatext.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class DatasetUploadRequest {

    @NotBlank
    @Size(max = 50)
    private String label;

    @NotBlank
    @Size(max = 20)
    private String participantId;

    @NotBlank
    private String dominantHand;

    @NotNull
    private Integer sampleNumber;

    @NotNull
    private Integer durationMs;

    private String resolution;
    private String userAgent;

    @NotNull
    @Size(min = 1)
    private List<DatasetFrameDto> frames;

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getParticipantId() { return participantId; }
    public void setParticipantId(String participantId) { this.participantId = participantId; }
    public String getDominantHand() { return dominantHand; }
    public void setDominantHand(String dominantHand) { this.dominantHand = dominantHand; }
    public Integer getSampleNumber() { return sampleNumber; }
    public void setSampleNumber(Integer sampleNumber) { this.sampleNumber = sampleNumber; }
    public Integer getDurationMs() { return durationMs; }
    public void setDurationMs(Integer durationMs) { this.durationMs = durationMs; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public List<DatasetFrameDto> getFrames() { return frames; }
    public void setFrames(List<DatasetFrameDto> frames) { this.frames = frames; }
}
