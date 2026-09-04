package br.com.rodogarcia.cms.backend.model.improvement;

import java.nio.file.Path;

public record ImprovementDownload(
    String id,
    String name,
    String mimeType,
    long size,
    String storedName,
    Path path,
    boolean inline
) {
}
