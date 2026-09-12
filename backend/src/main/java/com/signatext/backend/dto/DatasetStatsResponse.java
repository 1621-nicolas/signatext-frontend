package com.signatext.backend.dto;

public class DatasetStatsResponse {

    private long totalSamples;
    private long totalFrames;
    private long uniqueLabels;
    private long uniqueParticipants;

    public DatasetStatsResponse() {}

    public DatasetStatsResponse(long totalSamples, long totalFrames, long uniqueLabels, long uniqueParticipants) {
        this.totalSamples = totalSamples;
        this.totalFrames = totalFrames;
        this.uniqueLabels = uniqueLabels;
        this.uniqueParticipants = uniqueParticipants;
    }

    public long getTotalSamples() { return totalSamples; }
    public void setTotalSamples(long totalSamples) { this.totalSamples = totalSamples; }
    public long getTotalFrames() { return totalFrames; }
    public void setTotalFrames(long totalFrames) { this.totalFrames = totalFrames; }
    public long getUniqueLabels() { return uniqueLabels; }
    public void setUniqueLabels(long uniqueLabels) { this.uniqueLabels = uniqueLabels; }
    public long getUniqueParticipants() { return uniqueParticipants; }
    public void setUniqueParticipants(long uniqueParticipants) { this.uniqueParticipants = uniqueParticipants; }
}
