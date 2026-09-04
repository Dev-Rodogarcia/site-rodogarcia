package br.com.rodogarcia.cms.backend.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.service.MediaService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartHttpServletRequest;
import org.springframework.web.multipart.MultipartFile;

class MultipartPayloadTest {
    @Test
    void keepsTheAdminMediaBoundaryAtExactlySixtyFourMebibytes() {
        MultipartFile accepted = file(MediaService.MAX_VIDEO_UPLOAD_BYTES);
        MockMultipartHttpServletRequest acceptedRequest = new MockMultipartHttpServletRequest();
        acceptedRequest.addFile(accepted);
        assertThat(MultipartPayload.singleAdminMedia(acceptedRequest)).isSameAs(accepted);

        MultipartFile oversized = file(MediaService.MAX_VIDEO_UPLOAD_BYTES + 1);
        MockMultipartHttpServletRequest oversizedRequest = new MockMultipartHttpServletRequest();
        oversizedRequest.addFile(oversized);
        assertThatThrownBy(() -> MultipartPayload.singleAdminMedia(oversizedRequest))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).status()).isEqualTo(413))
            .hasMessage("Arquivo ou payload excede o limite permitido.");
    }

    private static MultipartFile file(long size) {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getName()).thenReturn("media");
        when(file.getSize()).thenReturn(size);
        return file;
    }
}
