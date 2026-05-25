import type { CSSProperties, ReactNode } from 'react';
import type { Game } from '../types';
import { coverStyle } from '../utils';

export function LibraryView({ games, profileName, isAdmin, onStore }: {
  games: Game[];
  profileName?: string;
  isAdmin: boolean;
  onStore: () => void;
}) {
  let content: ReactNode = <EmptyLibraryMessage>Faz login para abrir tua biblioteca.</EmptyLibraryMessage>;
  if (profileName && isAdmin) {
    content = <EmptyLibraryMessage>Administrador não possui biblioteca de compra. Usa a área Admin para gerir bibliotecas dos usuários.</EmptyLibraryMessage>;
  }
  if (profileName && !isAdmin && !games.length) {
    content = <EmptyLibraryMessage>Ainda não tem jogos na tua biblioteca.</EmptyLibraryMessage>;
  }
  if (profileName && !isAdmin && games.length) {
    content = games.map(game => (
      <div className="col" key={game.id}>
        <article className="library-card h-100">
          <div className="library-cover" style={{ '--cover': coverStyle(game.franchise) } as CSSProperties} />
          <div className="library-body">
            <h3>{game.title}</h3>
            <p>{game.description}</p>
            <button className="btn primary-btn full">Jogar</button>
          </div>
        </article>
      </div>
    ));
  }

  return (
    <section className="view active">
      <div className="container page-shell">
        <div className="page-header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3">
          <div>
            <span className="kicker">Área do usuário</span>
            <h1>Biblioteca</h1>
            <p>Jogos comprados ficam aqui. Admin usa só o painel interno.</p>
          </div>
          <button className="btn ghost-btn" onClick={onStore}>Voltar para loja</button>
        </div>
        <div className="page-panel library-panel">
          <div className="library-grid row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">{content}</div>
        </div>
      </div>
    </section>
  );
}

function EmptyLibraryMessage({ children }: { children: ReactNode }) {
  return (
    <div className="col-12">
      <div className="page-panel">{children}</div>
    </div>
  );
}
