import { useState } from "react";
import { ShieldCheck, Settings2 } from "lucide-react";
import { useVisits } from "../hooks/useVisits";
import { setVisitConsent } from "../lib/visits";
import { siteConfig } from "../data/portfolio";
import "./visits.css";

export default function VisitPrivacy() {
  const { initialized, consent, storageAvailable } = useVisits();
  const [editing, setEditing] = useState(false);
  const show = initialized && (consent === null || editing) && storageAvailable;
  async function choose(choice: "accepted" | "declined") {
    await setVisitConsent(choice);
    setEditing(false);
  }

  return (
    <>
      <section
        className="visit-privacy container"
        aria-label="Privacidade das visitas"
      >
        <details id="privacidade-visitas">
          <summary>
            <ShieldCheck size={14} aria-hidden="true" /> Privacidade e visitas
          </summary>
          <div className="visit-privacy-details">
            <p>
              Com autorização, também agregamos visualizações por país e,
              no Brasil, por estado usando
              a localização aproximada fornecida pela hospedagem. Não solicitamos
              GPS, não guardamos IPs para geografia e não mostramos localizações
              individuais. Acessos sem país permanecem nos totais.
            </p>
            <p>
              Com sua autorização, este site salva neste navegador um código
              aleatório, a primeira e a última visita, as visualizações e as
              sessões. Esses dados servem para reconhecer retornos e medir o
              acesso ao portfólio, sem cadastro, nome, e-mail ou fingerprinting.
            </p>
            <p>
              Uma sessão corresponde à vida desta aba. Atualizações contam como
              visualizações, mas não repetem a saudação nem criam uma nova
              sessão. Outra aba normalmente inicia outra sessão. Abas duplicadas
              ou restauradas podem herdar a sessão do navegador.
            </p>
            <p>
              A escolha vale por 180 dias. Sem permissão, não enviamos visitas à
              API nem criamos um identificador de reconhecimento. Salvamos
              apenas sua preferência e um sinal temporário para não repetir a
              saudação na aba. Se o armazenamento estiver bloqueado, o site
              funciona sem reconhecimento.
            </p>
            <p>
              Os totais são estimativas agregadas de acessos autorizados.
              Dispositivos diferentes, dados apagados, bloqueadores e automações
              podem afetar os números. O banco guarda agregados e hashes
              técnicos; não recebe seu nome ou e-mail. Para conter abuso, um
              hash de rede que muda a cada minuto é mantido por até dois
              minutos, sem guardar o IP original e sem usá-lo para contar
              pessoas.
            </p>
            <p>
              Você pode revogar a autorização abaixo. Isso apaga o
              reconhecimento local e interrompe novos registros; os totais já
              agregados permanecem. Dúvidas:{" "}
              <a href={`mailto:${siteConfig.contacts.email}`}>
                fale com Pedro Paulo
              </a>
              .
            </p>
          </div>
        </details>
        {storageAvailable ? (
          <button
            className="visit-privacy-edit"
            type="button"
            onClick={() => setEditing(true)}
          >
            <Settings2 size={14} aria-hidden="true" />
            {consent === "accepted"
              ? "Gerenciar autorização"
              : "Preferências de visitas"}
          </button>
        ) : (
          <p>Armazenamento bloqueado: reconhecimento e medição desativados.</p>
        )}
      </section>
      {show && (
        <aside
          className="visit-consent"
          aria-label="Preferências de privacidade"
        >
          <span className="visit-consent-heading">
            <ShieldCheck size={17} aria-hidden="true" /> Sua visita, sua escolha
          </span>
          <p>
            Posso salvar um identificador aleatório neste navegador para
            reconhecer seu retorno e medir visitas? Você pode mudar sua escolha
            no rodapé.{" "}
            <a
              href="/"
              data-section="privacidade-visitas"
              onClick={() =>
                document
                  .getElementById("privacidade-visitas")
                  ?.setAttribute("open", "")
              }
            >
              Como funciona
            </a>
          </p>
          <div className="visit-consent-actions">
            <button type="button" onClick={() => void choose("declined")}>
              {consent === "accepted" ? "Revogar autorização" : "Agora não"}
            </button>
            <button type="button" onClick={() => void choose("accepted")}>
              Permitir
            </button>
            {editing && consent !== null && (
              <button type="button" onClick={() => setEditing(false)}>
                Fechar
              </button>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
