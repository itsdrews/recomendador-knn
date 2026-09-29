import React, { useState } from 'react';
import type { User } from '../api/api';
import { api } from '../api/api';

export const OCCUPATION_MAP: Record<number, string> = {
  0: "Outro ou não especificado",
  1: "Acadêmico / Educador",
  2: "Artista",
  3: "Escriturário / Administrativo",
  4: "Estudante universitário / Pós-graduação",
  5: "Atendimento ao cliente",
  6: "Médico / Área da saúde",
  7: "Executivo / Gerencial",
  8: "Agricultor / Fazendeiro",
  9: "Dona(o) de casa",
  10: "Estudante (Ensino Fundamental / Médio)",
  11: "Advogado(a)",
  12: "Programador(a)",
  13: "Aposentado(a)",
  14: "Vendas / Marketing",
  15: "Cientista",
  16: "Autônomo(a)",
  17: "Técnico(a) / Engenheiro(a)",
  18: "Comerciante / Artesão",
  19: "Desempregado(a)",
  20: "Escritor(a)",
};

interface UserSelectionScreenProps {
  onConfirmUser: (user: User) => void;
}

export function UserSelectionScreen({
  onConfirmUser,
}: UserSelectionScreenProps) {
  const [inputUserId, setInputUserId] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingRandom, setCreatingRandom] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const idNum = Number(inputUserId);

    if (!inputUserId || Number.isNaN(idNum) || idNum <= 0) {
      setError('Por favor, informe um ID de usuário válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await api.getUserById(idNum);

      if (user) {
        setPendingUser(user);
      } else {
        setError(`Usuário #${idNum} não encontrado.`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar usuário no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRandomUser = async () => {
    setCreatingRandom(true);
    setError(null);

    try {
      const newUser = await api.createRandomUser();
      setPendingUser(newUser);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar novo usuário.');
    } finally {
      setCreatingRandom(false);
    }
  };

  const handleConfirm = () => {
    if (pendingUser) {
      onConfirmUser(pendingUser);
      setPendingUser(null);
    }
  };

  const handleCancel = () => {
    setPendingUser(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-2xl">

        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <p className="mb-1 font-mono text-xl uppercase tracking-widest text-[var(--color-amber)]">
            DJG Match
          </p>

          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--color-foreground)]">
            Acessar <span className="font-light italic">Perfil</span>
          </h1>

          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Digite o ID numérico do usuário para prosseguir.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="userId"
              className="mb-1.5 block font-mono text-xs text-[var(--color-muted)]"
            >
              ID DO USUÁRIO
            </label>

            <input
              id="userId"
              type="number"
              min="1"
              value={inputUserId}
              onChange={(e) => {
                setInputUserId(e.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder="Ex: 1, 12, 100"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-mono text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-amber)]"
              disabled={loading || creatingRandom}
              autoFocus
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-[var(--color-red-rate)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || creatingRandom || !inputUserId}
            className="w-full cursor-pointer rounded-xl bg-[var(--color-amber)] py-3 font-body text-sm font-semibold text-[#0a0a0e] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Buscando...' : 'Buscar Perfil'}
          </button>

          <button
            type="button"
            onClick={handleCreateRandomUser}
            disabled={loading || creatingRandom}
            className="w-full cursor-pointer rounded-xl bg-[var(--color-amber)] py-3 font-body text-sm font-semibold text-[#0a0a0e] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creatingRandom ? 'Criando...' : 'Novo Usuário'}
          </button>
        </form>
      </div>

      {/* Modal de confirmação */}
      {pendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">

            <div className="mb-6">
              <span className="rounded-full bg-[var(--color-amber-glow)] px-2.5 py-1 font-mono text-xs text-[var(--color-amber)]">
                Perfil Encontrado
              </span>

              <h3 className="mt-3 font-display text-2xl font-bold text-[var(--color-foreground)]">
                Usuário #{pendingUser.user_id}
              </h3>

              <p className="font-mono text-xs text-[var(--color-muted)]">
                ID da Conta: #{pendingUser.user_id}
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 font-mono text-xs">

              <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                <span className="text-[var(--color-muted)]">
                  Gênero:
                </span>

                <span className="font-medium text-[var(--color-foreground)]">
                  {pendingUser.gender === 'M'
                    ? 'Masculino (M)'
                    : pendingUser.gender === 'F'
                      ? 'Feminino (F)'
                      : pendingUser.gender}
                </span>
              </div>

              <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                <span className="text-[var(--color-muted)]">
                  Idade:
                </span>

                <span className="font-medium text-[var(--color-foreground)]">
                  {pendingUser.age} anos
                </span>
              </div>

              <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                <span className="text-[var(--color-muted)]">
                  Ocupação:
                </span>

                <span className="font-medium text-[var(--color-amber)]">
                  {OCCUPATION_MAP[pendingUser.occupation] ||
                    `Código ${pendingUser.occupation}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">
                  Código Postal / Zip Code:
                </span>

                <span className="font-medium text-[var(--color-foreground)]">
                  {pendingUser.zip_code}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 font-body text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 cursor-pointer rounded-xl bg-[var(--color-amber)] py-3 font-body text-sm font-semibold text-[#0a0a0e] transition-opacity hover:opacity-90"
              >
                Confirmar e Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}