package br.com.rodogarcia.landingbuilder.security;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

/** Reexpõe o corpo JSON já validado para o conversor MVC sem ler o socket duas vezes. */
final class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {

    private final byte[] body;

    CachedBodyHttpServletRequest(HttpServletRequest request, byte[] body) {
        super(request);
        this.body = body.clone();
    }

    @Override
    public ServletInputStream getInputStream() {
        return new ByteArrayServletInputStream(body);
    }

    @Override
    public BufferedReader getReader() {
        String configured = getCharacterEncoding();
        Charset charset;
        try {
            charset = configured == null ? StandardCharsets.UTF_8 : Charset.forName(configured);
        } catch (RuntimeException ignored) {
            charset = StandardCharsets.UTF_8;
        }
        return new BufferedReader(new InputStreamReader(getInputStream(), charset));
    }

    @Override
    public int getContentLength() {
        return body.length;
    }

    @Override
    public long getContentLengthLong() {
        return body.length;
    }

    private static final class ByteArrayServletInputStream extends ServletInputStream {

        private final ByteArrayInputStream input;

        private ByteArrayServletInputStream(byte[] body) {
            input = new ByteArrayInputStream(body);
        }

        @Override
        public int read() {
            return input.read();
        }

        @Override
        public int read(byte[] bytes, int offset, int length) {
            return input.read(bytes, offset, length);
        }

        @Override
        public boolean isFinished() {
            return input.available() == 0;
        }

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setReadListener(ReadListener listener) {
            if (listener == null) return;
            try {
                if (isFinished()) {
                    listener.onAllDataRead();
                } else {
                    listener.onDataAvailable();
                }
            } catch (IOException error) {
                listener.onError(error);
            }
        }
    }
}
