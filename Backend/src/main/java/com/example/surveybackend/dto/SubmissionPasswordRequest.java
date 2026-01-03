package com.example.surveybackend.dto;

public class SubmissionPasswordRequest {
    private String password;

    public SubmissionPasswordRequest() {}

    public SubmissionPasswordRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
