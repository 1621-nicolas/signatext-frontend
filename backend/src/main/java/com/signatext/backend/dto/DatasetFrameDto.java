package com.signatext.backend.dto;

import java.util.List;

public class DatasetFrameDto {

    private Integer timestamp;
    private List<Double> leftHand;
    private List<Double> rightHand;
    private Double leftHandedness;
    private Double rightHandedness;

    public Integer getTimestamp() { return timestamp; }
    public void setTimestamp(Integer timestamp) { this.timestamp = timestamp; }
    public List<Double> getLeftHand() { return leftHand; }
    public void setLeftHand(List<Double> leftHand) { this.leftHand = leftHand; }
    public List<Double> getRightHand() { return rightHand; }
    public void setRightHand(List<Double> rightHand) { this.rightHand = rightHand; }
    public Double getLeftHandedness() { return leftHandedness; }
    public void setLeftHandedness(Double leftHandedness) { this.leftHandedness = leftHandedness; }
    public Double getRightHandedness() { return rightHandedness; }
    public void setRightHandedness(Double rightHandedness) { this.rightHandedness = rightHandedness; }
}
