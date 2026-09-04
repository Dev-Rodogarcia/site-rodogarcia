package br.com.rodogarcia.cms.backend.model.improvement;

public record ImprovementUpload(String originalName, byte[] bytes) {

    public long size() {
        return bytes.length;
    }
}
