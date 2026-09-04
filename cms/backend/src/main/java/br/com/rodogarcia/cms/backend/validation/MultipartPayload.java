package br.com.rodogarcia.cms.backend.validation;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.improvement.ImprovementUpload;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

public final class MultipartPayload {

    private MultipartPayload() {
    }

    public static ImprovementForm improvement(HttpServletRequest request) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        int fieldParts = 0;
        if (request instanceof MultipartHttpServletRequest) {
            var names = request.getParameterNames();
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                String[] values = request.getParameterValues(name);
                List<String> items = values == null ? List.of() : List.of(values);
                fields.put(name, items);
                fieldParts += items.size();
                for (String value : items) {
                    if (value.getBytes(StandardCharsets.UTF_8).length > 64 * 1_024) {
                        throw new ApiException(422, "Field value too long");
                    }
                }
            }
        }
        if (fieldParts > 12) throw new ApiException(422, "Too many fields");

        List<ImprovementUpload> uploads = new ArrayList<>();
        int fileParts = 0;
        if (request instanceof MultipartHttpServletRequest multipart) {
            for (Map.Entry<String, List<MultipartFile>> entry : multipart.getMultiFileMap().entrySet()) {
                if (!entry.getKey().equals("attachments")) {
                    throw new ApiException(422, "Unexpected field");
                }
                fileParts += entry.getValue().size();
                for (MultipartFile file : entry.getValue()) {
                    if (file.getSize() > 8L * 1_024 * 1_024) {
                        throw new ApiException(413, "Arquivo ou payload excede o limite permitido.");
                    }
                    try {
                        uploads.add(new ImprovementUpload(
                            file.getOriginalFilename() == null ? "" : file.getOriginalFilename(),
                            file.getBytes()
                        ));
                    } catch (IOException error) {
                        throw new ApiException(500, "Erro interno no servidor.");
                    }
                }
            }
        }
        if (fileParts > 5) throw new ApiException(422, "Too many files");
        if (fieldParts + fileParts > 17) throw new ApiException(422, "Too many parts");
        return new ImprovementForm(fields, List.copyOf(uploads));
    }

    public static MultipartFile singleAdminMedia(HttpServletRequest request) {
        if (!(request instanceof MultipartHttpServletRequest multipart)) return null;
        int count = 0;
        MultipartFile selected = null;
        for (Map.Entry<String, List<MultipartFile>> entry : multipart.getMultiFileMap().entrySet()) {
            if (!entry.getKey().equals("image") && !entry.getKey().equals("media")) {
                throw new ApiException(422, "Unexpected field");
            }
            for (MultipartFile file : entry.getValue()) {
                count++;
                if (entry.getKey().equals("media") || selected == null) selected = file;
            }
        }
        if (count > 1) throw new ApiException(422, "Too many files");
        if (selected != null && selected.getSize() > 64L * 1_024 * 1_024) {
            throw new ApiException(413, "Arquivo ou payload excede o limite permitido.");
        }
        return selected;
    }

    public record ImprovementForm(
        Map<String, List<String>> fields,
        List<ImprovementUpload> attachments
    ) {
    }
}
