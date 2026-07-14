"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  IdentificationBadge,
  PencilSimple,
  ShieldCheck,
  Trash,
  UserCirclePlus,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperCarouselPagination,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperStatusPill,
  developerInputClassName,
  developerDangerButtonClassName,
  developerGhostButtonClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
  active: boolean;
  protected?: boolean;
  isSupreme?: boolean;
}

interface UsersResponse {
  user?: AdminUser;
  users?: AdminUser[];
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "user";
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "admin",
};

const USERS_PER_PAGE = 4;

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getPasswordChecks(password: string) {
  return [
    { label: "10 caracteres", valid: password.length >= 10 },
    { label: "Até 72 caracteres", valid: password.length <= 72 },
    { label: "Letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Letra maiúscula", valid: /[A-Z]/.test(password) },
    { label: "Número", valid: /[0-9]/.test(password) },
  ];
}

export default function UsuariosPage() {
  const { apiRequest } = useApiRequest();
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [editingId, setEditingId] = useState("");
  const [editing, setEditing] = useState<Partial<AdminUser>>({});
  const [saving, setSaving] = useState(false);
  const [mutatingId, setMutatingId] = useState("");
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [statusMessage, setStatusMessage] = useState("");
  const { data, loading, error, refresh } = useAdminResource<AdminUser[]>({
    key: adminResourceKeys.users,
    fetcher: async (request) => {
      const response = await request<UsersResponse>(api.admin.users);

      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar usuários.",
        };
      }

      return {
        success: true,
        data: response.data?.users ?? [],
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setUsers(data);
  }, [data]);

  async function loadUsers() {
    const response = await apiRequest<UsersResponse>(api.admin.users);
    if (response.success) {
      setUsers(response.data?.users ?? []);
      setCurrentUser(response.data?.user ?? null);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );
  const adminCount = users.filter((user) => user.role === "admin" && user.active).length;
  const activeCount = users.filter((user) => user.active).length;
  const canManageUsers = Boolean(currentUser?.isSupreme || currentUser?.protected);
  const {
    pages: userPages,
    currentPage: usersPage,
    totalPages: usersTotalPages,
    nextPage: nextUsersPage,
    prevPage: prevUsersPage,
  } = useCarouselPagination(users, USERS_PER_PAGE);

  function resetForm() {
    setForm(EMPTY_FORM);
    setStatus("");
    setStatusMessage("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!canManageUsers) {
      setStatus("error");
      setStatusMessage("Somente o usuário supremo pode criar ou alterar acessos.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setStatus("error");
      setStatusMessage("Preencha nome, e-mail e senha antes de criar o usuário.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setStatusMessage("As senhas não conferem.");
      return;
    }

    if (passwordChecks.some((check) => !check.valid)) {
      setStatus("error");
      setStatusMessage("A senha ainda não atende aos requisitos mínimos.");
      return;
    }

    setSaving(true);
    setStatus("");
    setStatusMessage("");

    const response = await apiRequest<UsersResponse>(api.admin.users, {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      }),
    });

    setSaving(false);

    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao criar usuário.");
      return;
    }

    setUsers(response.data?.users ?? users);
    setCurrentUser(response.data?.user ?? currentUser);
    invalidateAdminResource([adminResourceKeys.users, adminResourceKeys.dashboard]);
    setStatus("success");
    setStatusMessage("Usuário criado com sucesso.");
    setForm(EMPTY_FORM);
    await refresh();
    await loadUsers();
  }

  function beginEdit(user: AdminUser) {
    setEditingId(user.id);
    setEditing({
      name: user.name ?? "",
      email: user.email,
      role: user.role,
      active: user.active,
    });
  }

  async function saveUser(user: AdminUser) {
    setMutatingId(user.id);
    setStatus("");
    setStatusMessage("");
    const response = await apiRequest<UsersResponse>(`${api.admin.users}/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(editing),
    });
    setMutatingId("");
    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao atualizar usuário.");
      return;
    }
    setUsers(response.data?.users ?? users);
    setEditingId("");
    setEditing({});
    setStatus("success");
    setStatusMessage("Usuário atualizado com sucesso.");
    invalidateAdminResource([adminResourceKeys.users, adminResourceKeys.dashboard]);
    await refresh();
    await loadUsers();
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Excluir o acesso de ${user.email}?`)) return;
    setMutatingId(user.id);
    setStatus("");
    setStatusMessage("");
    const response = await apiRequest<UsersResponse>(`${api.admin.users}/${user.id}`, {
      method: "DELETE",
    });
    setMutatingId("");
    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao excluir usuário.");
      return;
    }
    setUsers(response.data?.users ?? users);
    setStatus("success");
    setStatusMessage("Usuário removido com sucesso.");
    invalidateAdminResource([adminResourceKeys.users, adminResourceKeys.dashboard]);
    await refresh();
    await loadUsers();
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Segurança - Usuários"
        title="Criação de usuários do CMS."
        description="Cadastre novos acessos internos sem usar a tela pública de setup inicial. A gestão exige a conta suprema ativa e token CSRF."
        stats={[
          { label: "Usuários", value: users.length },
          { label: "Admins ativos", value: adminCount },
          { label: "Ativos", value: activeCount },
        ]}
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando usuários...</DeveloperMessage>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <DeveloperMessage tone="error">{error}</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(340px,440px)_minmax(0,1fr)]">
        <DeveloperCard className="p-5 xl:sticky xl:top-5">
          <DeveloperSectionHeading
            eyebrow="Novo acesso"
            title="Criar usuário"
            description="Use uma senha forte. O novo usuário poderá acessar o painel conforme o papel definido abaixo."
            tooltip="Usuário interno é uma conta criada para operar o CMS. Exemplo: admin@empresa.com.br."
          />

          {!canManageUsers ? (
            <div className="mb-5">
              <DeveloperMessage tone="info">
                Sua conta pode visualizar os acessos. Criação, edição e exclusão ficam restritas ao usuário supremo.
              </DeveloperMessage>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <DeveloperField label="Nome" required>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                maxLength={80}
                required
                autoComplete="name"
                className={developerInputClassName}
              />
            </DeveloperField>

            <DeveloperField label="E-mail" required>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                maxLength={160}
                required
                autoComplete="email"
                className={developerInputClassName}
              />
            </DeveloperField>

            <DeveloperField
              label="Perfil de acesso"
              required
              hint="Admin acessa o painel. A gestão de acessos continua exclusiva da conta suprema."
              tooltip="Define o acesso ao CMS; este perfil não concede a um administrador comum permissão para gerenciar usuários."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "admin" as const,
                    label: "Administrador",
                    description: "Pode acessar o CMS, sem gerenciar outros usuários.",
                  },
                  {
                    value: "user" as const,
                    label: "Usuário",
                    description: "Conta comum, sem permissão de admin no painel atual.",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-[78px] items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/78 px-3.5 py-3 text-sm"
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={form.role === option.value}
                      onChange={() =>
                        setForm((current) => ({ ...current, role: option.value }))
                      }
                      className="mt-1 h-4 w-4 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="block font-semibold text-[var(--foreground)]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-muted-raw)]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Senha" required>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  className={developerInputClassName}
                />
              </DeveloperField>

              <DeveloperField label="Confirmar senha" required>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50/78 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Requisitos da senha
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <span
                    key={check.label}
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-raw)]"
                  >
                    {check.valid ? (
                      <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                    ) : (
                      <X size={16} weight="bold" className="text-slate-400" />
                    )}
                    {check.label}
                  </span>
                ))}
              </div>
            </div>

            {status ? (
              <DeveloperMessage tone={status === "success" ? "success" : "error"}>
                {statusMessage}
              </DeveloperMessage>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving || !canManageUsers}
                className={developerPrimaryButtonClassName}
              >
                <UserCirclePlus size={18} weight="bold" />
                {saving ? "Criando..." : "Criar usuário"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                title="Limpa os campos do formulário sem apagar usuários salvos."
                className={developerSecondaryButtonClassName}
              >
                <X size={18} weight="bold" />
                Limpar
              </button>
            </div>
          </form>
        </DeveloperCard>

        <DeveloperCard className="self-start p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Acessos cadastrados"
            title="Usuários do painel"
            description="Lista de contas persistidas no storage privado de usuários."
            tooltip="Lista de usuários internos autorizados no CMS, com status e função de acesso."
          />

          <div className="space-y-3">
            {users.length > 0 ? (
              (userPages[usersPage] ?? []).map((user) => {
                const editingThis = editingId === user.id;
                const locked = Boolean(user.protected || !canManageUsers);
                return (
                <article
                  key={user.id}
                  className="rounded-[18px] border border-slate-200 bg-slate-50/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                        {user.role === "admin" ? (
                          <ShieldCheck size={22} weight="duotone" />
                        ) : (
                          <IdentificationBadge size={22} weight="duotone" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                          {user.name || "Usuário sem nome"}
                        </h3>
                        <p className="mt-1 truncate text-sm text-[var(--color-muted-raw)]">
                          {user.email}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted-raw)]">
                          Criado em {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {user.protected ? (
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                          Supremo
                        </span>
                      ) : null}
                      <DeveloperStatusPill
                        active={user.active}
                        activeLabel="Ativo"
                        inactiveLabel="Inativo"
                      />
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </div>
                  </div>

                  {editingThis ? (
                  <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white/82 p-3 lg:grid-cols-2">
                      <DeveloperField label="Nome" required>
                        <input
                          value={String(editing.name ?? "")}
                          onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))}
                          maxLength={80}
                          required
                          className={developerInputClassName}
                        />
                      </DeveloperField>
                      <DeveloperField label="E-mail" required>
                        <input
                          type="email"
                          value={String(editing.email ?? "")}
                          onChange={(event) => setEditing((current) => ({ ...current, email: event.target.value }))}
                          maxLength={160}
                          required
                          className={developerInputClassName}
                        />
                      </DeveloperField>
                      <DeveloperField label="Perfil">
                        <select
                          value={(editing.role as AdminUser["role"]) ?? user.role}
                          disabled={user.protected}
                          onChange={(event) => setEditing((current) => ({ ...current, role: event.target.value as AdminUser["role"] }))}
                          className={developerInputClassName}
                        >
                          <option value="admin">Administrador</option>
                          <option value="user">Usuário</option>
                        </select>
                      </DeveloperField>
                      <label className="flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(editing.active ?? user.active)}
                          disabled={user.protected}
                          onChange={(event) => setEditing((current) => ({ ...current, active: event.target.checked }))}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        Usuário ativo
                      </label>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {editingThis ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveUser(user)}
                          disabled={mutatingId === user.id}
                          className={developerPrimaryButtonClassName}
                        >
                          <CheckCircle size={16} weight="bold" />
                          {mutatingId === user.id ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId("");
                            setEditing({});
                          }}
                          className={developerSecondaryButtonClassName}
                        >
                          <X size={16} weight="bold" />
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => beginEdit(user)}
                          disabled={locked}
                          className={developerGhostButtonClassName}
                          title={locked ? "Edição restrita ao usuário supremo." : "Editar usuário"}
                        >
                          <PencilSimple size={16} weight="bold" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeUser(user)}
                          disabled={locked || mutatingId === user.id}
                          className={developerDangerButtonClassName}
                          title={
                            user.protected
                              ? "O usuário supremo não pode ser excluído."
                              : locked
                                ? "Exclusão restrita ao usuário supremo."
                                : "Excluir usuário"
                          }
                        >
                          <Trash size={16} weight="bold" />
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </article>
                );
              })
            ) : (
              <DeveloperMessage tone="info">
                Nenhum usuário encontrado no storage atual.
              </DeveloperMessage>
            )}
          </div>

          {users.length > 0 ? (
            <DeveloperCarouselPagination
              currentPage={usersPage}
              totalPages={usersTotalPages}
              onNext={nextUsersPage}
              onPrev={prevUsersPage}
              compact
              alwaysVisible
            />
          ) : null}

          <div className="mt-4 rounded-[18px] border border-[#bfdbfe] bg-[#eff6ff]/72 p-4">
            <div className="flex items-start gap-3">
              <UsersThree
                size={22}
                weight="duotone"
                className="mt-0.5 shrink-0 text-[var(--primary)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Política atual
                </p>
                <p className="mt-1 text-sm leading-7 text-[var(--color-muted-raw)]">
                  O usuário supremo tem acesso total e é o único autorizado a criar,
                  editar, excluir ou alterar perfis. Essa conta não pode ser excluída,
                  desativada nem rebaixada.
                </p>
              </div>
            </div>
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
