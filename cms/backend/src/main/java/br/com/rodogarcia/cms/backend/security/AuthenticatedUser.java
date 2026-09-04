package br.com.rodogarcia.cms.backend.security;

import br.com.rodogarcia.cms.backend.model.auth.SessionRecord;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;

public record AuthenticatedUser(SessionRecord session, UserRecord user) {
}
