package br.com.rodogarcia.cms.backend.controller;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.ByteBuffer;
import java.nio.channels.SeekableByteChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public final class UploadsController {
    private static final byte[] INTERNAL_ERROR =
        "{\"error\":\"Erro interno no servidor.\"}".getBytes(StandardCharsets.UTF_8);
    private static final Pattern CACHE_CONTROL_NO_CACHE = Pattern.compile(
        "(?:^|,)\\s*?no-cache\\s*?(?:,|$)", Pattern.CASE_INSENSITIVE
    );

    private final Path uploadsRoot;

    public UploadsController(CmsProperties properties) {
        this.uploadsRoot = properties.uploadsDir().toAbsolutePath().normalize();
    }

    @RequestMapping(path = {"/uploads", "/uploads/**"}, method = {RequestMethod.GET, RequestMethod.HEAD})
    public void upload(HttpServletRequest request, HttpServletResponse response) {
        Path file = resolve(request);
        boolean trailingSlash = request.getRequestURI().endsWith("/");
        if (Files.isDirectory(file)) {
            if (!trailingSlash) {
                directoryRedirect(request, response);
                return;
            }
            file = file.resolve("index.html").toAbsolutePath().normalize();
        } else if (trailingSlash) {
            throw new ApiException(404, "Recurso não encontrado.");
        }
        if (!Files.isRegularFile(file)) throw new ApiException(404, "Recurso não encontrado.");
        try {
            serveFile(file, request, response);
        } catch (IOException error) {
            if (response.isCommitted()) return;
            throw new ApiException(404, "Recurso não encontrado.");
        }
    }

    private Path resolve(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String lowerUri = requestUri.toLowerCase(Locale.ROOT);
        int start = lowerUri.indexOf("/uploads");
        if (start < 0) throw new ApiException(404, "Recurso não encontrado.");
        int relativeStart = start + "/uploads".length();
        if (relativeStart < requestUri.length() && requestUri.charAt(relativeStart) != '/') {
            throw new ApiException(404, "Recurso não encontrado.");
        }
        String encoded = requestUri.substring(relativeStart);
        while (encoded.startsWith("/")) encoded = encoded.substring(1);
        String relative;
        try {
            relative = URLDecoder.decode(encoded.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException error) {
            throw new ApiException(404, "Recurso não encontrado.");
        }
        if (relative.indexOf('\0') >= 0 || relative.indexOf('\\') >= 0) {
            throw new ApiException(404, "Recurso não encontrado.");
        }
        for (String segment : relative.split("/", -1)) {
            if (segment.equals("..") || segment.startsWith(".")) {
                throw new ApiException(404, "Recurso não encontrado.");
            }
        }
        try {
            Path resolved = uploadsRoot.resolve(relative).toAbsolutePath().normalize();
            if (!resolved.startsWith(uploadsRoot)) {
                throw new ApiException(404, "Recurso não encontrado.");
            }
            return resolved;
        } catch (InvalidPathException error) {
            throw new ApiException(404, "Recurso não encontrado.");
        }
    }

    private static void directoryRedirect(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        String path = request.getRequestURI().replaceFirst("^/+", "/") + "/";
        String query = request.getQueryString();
        String location = query == null || query.isEmpty() ? path : path + "?" + query;
        String document = "<!DOCTYPE html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"utf-8\">\n"
            + "<title>Redirecting</title>\n"
            + "</head>\n"
            + "<body>\n"
            + "<pre>Redirecting to " + escapeHtml(location) + "</pre>\n"
            + "</body>\n"
            + "</html>\n";
        byte[] body = document.getBytes(StandardCharsets.UTF_8);
        response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
        response.setHeader(HttpHeaders.LOCATION, location);
        response.setHeader("Content-Security-Policy", "default-src 'none'");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setContentType("text/html; charset=UTF-8");
        response.setContentLength(body.length);
        if (!request.getMethod().equals("HEAD")) write(response, body);
    }

    private static String escapeHtml(String value) {
        return value.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    private static void serveFile(
        Path file,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        long size = Files.size(file);
        long lastModified = Files.getLastModifiedTime(file).toMillis();
        String etag = ImprovementController.weakEtag(size, lastModified);
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setHeader(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable");
        response.setDateHeader(HttpHeaders.LAST_MODIFIED, lastModified);
        response.setHeader(HttpHeaders.ETAG, etag);
        response.setContentType(contentType(file));

        if (preconditionFailed(request, etag, lastModified)) {
            internalError(request, response);
            return;
        }
        if (fresh(request, etag, lastModified)) {
            response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
            response.setHeader(HttpHeaders.CONTENT_TYPE, null);
            response.setHeader(HttpHeaders.CONTENT_LENGTH, null);
            response.setHeader(HttpHeaders.CONTENT_RANGE, null);
            response.setHeader(HttpHeaders.CONTENT_ENCODING, null);
            response.setHeader(HttpHeaders.CONTENT_LANGUAGE, null);
            return;
        }

        RangeSelection range = range(request, size, etag, lastModified);
        if (range.unsatisfiable()) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + size);
            internalError(request, response);
            return;
        }
        if (range.partial()) {
            long length = range.end() - range.start() + 1;
            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
            response.setHeader(
                HttpHeaders.CONTENT_RANGE,
                "bytes " + range.start() + "-" + range.end() + "/" + size
            );
            response.setContentLengthLong(length);
            if (!request.getMethod().equals("HEAD")) {
                copy(file, response, range.start(), length);
            }
            return;
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentLengthLong(size);
        if (!request.getMethod().equals("HEAD")) Files.copy(file, response.getOutputStream());
    }

    private static boolean preconditionFailed(
        HttpServletRequest request,
        String etag,
        long lastModified
    ) {
        String ifMatch = request.getHeader(HttpHeaders.IF_MATCH);
        if (ifMatch != null && !ifMatch.isEmpty()) {
            if (ifMatch.equals("*")) return false;
            String normalized = stripWeak(etag);
            for (String candidate : ifMatch.split(",", -1)) {
                if (stripWeak(candidate.trim()).equals(normalized)) return false;
            }
            return true;
        }
        Long unmodifiedSince = dateHeader(request, HttpHeaders.IF_UNMODIFIED_SINCE);
        return unmodifiedSince != null && httpDate(lastModified) > unmodifiedSince;
    }

    private static boolean fresh(HttpServletRequest request, String etag, long lastModified) {
        String noneMatch = request.getHeader(HttpHeaders.IF_NONE_MATCH);
        String modifiedSince = request.getHeader(HttpHeaders.IF_MODIFIED_SINCE);
        if ((noneMatch == null || noneMatch.isEmpty())
            && (modifiedSince == null || modifiedSince.isEmpty())) return false;
        String cacheControl = request.getHeader(HttpHeaders.CACHE_CONTROL);
        if (cacheControl != null && CACHE_CONTROL_NO_CACHE.matcher(cacheControl).find()) return false;
        if (noneMatch != null && !noneMatch.isEmpty()) {
            if (noneMatch.equals("*")) return true;
            String normalized = stripWeak(etag);
            for (String candidate : noneMatch.split(",", -1)) {
                if (stripWeak(candidate.trim()).equals(normalized)) return true;
            }
            return false;
        }
        Long requested = dateHeader(request, HttpHeaders.IF_MODIFIED_SINCE);
        return requested != null && httpDate(lastModified) <= requested;
    }

    private static RangeSelection range(
        HttpServletRequest request,
        long size,
        String etag,
        long lastModified
    ) {
        String raw = request.getHeader(HttpHeaders.RANGE);
        if (raw == null || !raw.matches("^ *bytes=.*")) return RangeSelection.full();
        if (!rangeFresh(request.getHeader(HttpHeaders.IF_RANGE), etag, lastModified)) {
            return RangeSelection.full();
        }
        String[] specifications = raw.substring(raw.indexOf('=') + 1).split(",", -1);
        List<ByteRange> parsed = new ArrayList<>();
        for (String specification : specifications) {
            int dash = specification.indexOf('-');
            if (dash < 0) return RangeSelection.full();
            String startText = specification.substring(0, dash).trim();
            String endText = specification.substring(dash + 1).trim();
            if ((!startText.isEmpty() && !startText.matches("\\d+"))
                || (!endText.isEmpty() && !endText.matches("\\d+"))
                || (startText.isEmpty() && endText.isEmpty())) {
                return RangeSelection.full();
            }
            long start;
            long end;
            try {
                if (startText.isEmpty()) {
                    long suffix = Long.parseLong(endText);
                    start = size - suffix;
                    end = size - 1;
                } else {
                    start = Long.parseLong(startText);
                    end = endText.isEmpty() ? size - 1 : Long.parseLong(endText);
                }
            } catch (NumberFormatException ignored) {
                return RangeSelection.full();
            }
            end = Math.min(end, size - 1);
            if (start > end || start < 0) continue;
            parsed.add(new ByteRange(start, end));
        }
        if (parsed.isEmpty()) return RangeSelection.invalid();
        parsed.sort(Comparator.comparingLong(ByteRange::start));
        long start = parsed.getFirst().start();
        long end = parsed.getFirst().end();
        int combined = 1;
        for (int index = 1; index < parsed.size(); index++) {
            ByteRange item = parsed.get(index);
            if (item.start() > end + 1) {
                combined++;
            } else {
                end = Math.max(end, item.end());
            }
        }
        return combined == 1
            ? RangeSelection.partial(start, end)
            : RangeSelection.full();
    }

    private static boolean rangeFresh(String ifRange, String etag, long lastModified) {
        if (ifRange == null || ifRange.isEmpty()) return true;
        if (ifRange.indexOf('"') >= 0) return ifRange.contains(etag);
        try {
            long timestamp = java.time.ZonedDateTime.parse(
                ifRange,
                java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME
            ).toInstant().toEpochMilli();
            return httpDate(lastModified) <= timestamp;
        } catch (java.time.format.DateTimeParseException ignored) {
            return false;
        }
    }

    private static Long dateHeader(HttpServletRequest request, String name) {
        if (request.getHeader(name) == null) return null;
        try {
            long value = request.getDateHeader(name);
            return value < 0 ? null : value;
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static long httpDate(long timestamp) {
        return Math.floorDiv(timestamp, 1_000) * 1_000;
    }

    private static String stripWeak(String value) {
        return value.startsWith("W/") ? value.substring(2) : value;
    }

    private static void internalError(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        response.setContentLength(INTERNAL_ERROR.length);
        if (!request.getMethod().equals("HEAD")) response.getOutputStream().write(INTERNAL_ERROR);
    }

    private static void copy(
        Path file,
        HttpServletResponse response,
        long start,
        long length
    ) throws IOException {
        try (SeekableByteChannel channel = Files.newByteChannel(file, StandardOpenOption.READ)) {
            channel.position(start);
            ByteBuffer buffer = ByteBuffer.allocate(16 * 1_024);
            long remaining = length;
            while (remaining > 0) {
                buffer.clear();
                buffer.limit((int) Math.min(buffer.capacity(), remaining));
                int read = channel.read(buffer);
                if (read < 0) break;
                response.getOutputStream().write(buffer.array(), 0, read);
                remaining -= read;
            }
        }
    }

    private static void write(HttpServletResponse response, byte[] body) {
        try {
            response.getOutputStream().write(body);
        } catch (IOException error) {
            throw new ApiException(500, "Erro interno no servidor.");
        }
    }

    private static String contentType(Path file) {
        String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".avif")) return "image/avif";
        if (name.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
        if (name.endsWith(".webm")) return "video/webm";
        if (name.endsWith(".mp4")) return "video/mp4";
        if (name.endsWith(".ogg")) return "video/ogg";
        MediaType type = MediaTypeFactory.getMediaType(file.getFileName().toString())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);
        if (type.getType().equals("text")
            || type.isCompatibleWith(MediaType.APPLICATION_JSON)
            || type.getSubtype().equals("javascript")
            || type.getSubtype().endsWith("+xml")
            || type.isCompatibleWith(MediaType.APPLICATION_XML)) {
            return type.getType() + "/" + type.getSubtype() + "; charset=utf-8";
        }
        return type.toString();
    }

    private record ByteRange(long start, long end) {
    }

    private record RangeSelection(boolean partial, boolean unsatisfiable, long start, long end) {
        static RangeSelection full() {
            return new RangeSelection(false, false, 0, 0);
        }

        static RangeSelection invalid() {
            return new RangeSelection(false, true, 0, 0);
        }

        static RangeSelection partial(long start, long end) {
            return new RangeSelection(true, false, start, end);
        }
    }
}
