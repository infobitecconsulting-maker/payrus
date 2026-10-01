// Merge-only: webhook keys for every locale.
import { readFileSync, writeFileSync } from "node:fs";
const K = {
  "webhooks.title": ["Webhooks", "Webhooks", "Webhooks", "Webhooks"],
  "webhooks.hint": ["Get a signed HTTPS call when records change. The header PayRus-Signature is t=<time>,v1=<HMAC-SHA256 of \"<time>.<raw body>\" with your secret>. Failed deliveries retry after 1 min, 5 min, 30 min, 2 h and 12 h.", "Recevez un appel HTTPS signé quand des enregistrements changent. L'en-tête PayRus-Signature est t=<heure>,v1=<HMAC-SHA256 de \"<heure>.<corps brut>\" avec votre secret>. Les échecs sont rejoués après 1 min, 5 min, 30 min, 2 h et 12 h.", "Receba uma chamada HTTPS assinada quando os registos mudam. O cabeçalho PayRus-Signature é t=<hora>,v1=<HMAC-SHA256 de \"<hora>.<corpo bruto>\" com o seu segredo>. As falhas são repetidas após 1 min, 5 min, 30 min, 2 h e 12 h.", "Reciba una llamada HTTPS firmada cuando cambien los registros. La cabecera PayRus-Signature es t=<hora>,v1=<HMAC-SHA256 de \"<hora>.<cuerpo en bruto>\" con su secreto>. Los fallos se reintentan tras 1 min, 5 min, 30 min, 2 h y 12 h."],
  "webhooks.secretOnce": ["Signing secret — shown only now. Store it in your receiver.", "Secret de signature — affiché une seule fois. Conservez-le dans votre récepteur.", "Segredo de assinatura — mostrado só agora. Guarde-o no seu recetor.", "Secreto de firma — se muestra solo ahora. Guárdelo en su receptor."],
  "webhooks.done": ["Done", "Terminé", "Concluído", "Hecho"],
  "webhooks.copied": ["Copied", "Copié", "Copiado", "Copiado"],
  "webhooks.copyFail": ["Copy failed", "Échec de la copie", "Falha ao copiar", "Error al copiar"],
  "webhooks.none": ["No webhooks yet.", "Aucun webhook pour l'instant.", "Ainda sem webhooks.", "Aún no hay webhooks."],
  "webhooks.delivered": ["delivered", "livrés", "entregues", "entregados"],
  "webhooks.failed": ["failed", "échoués", "falhados", "fallidos"],
  "webhooks.pending": ["pending", "en attente", "pendentes", "pendientes"],
  "webhooks.last": ["last", "dernier", "último", "último"],
  "webhooks.active": ["Active", "Actif", "Ativo", "Activo"],
  "webhooks.paused": ["Paused", "En pause", "Em pausa", "En pausa"],
  "webhooks.test": ["Send test", "Envoyer un test", "Enviar teste", "Enviar prueba"],
  "webhooks.testQueued": ["Test event queued — delivered within a minute", "Événement de test en file — livré sous une minute", "Evento de teste em fila — entregue em menos de um minuto", "Evento de prueba en cola — entregado en menos de un minuto"],
  "webhooks.rotate": ["Rotate secret", "Renouveler le secret", "Rodar segredo", "Rotar secreto"],
  "webhooks.rotateConfirm": ["Rotate the signing secret? Your receiver must switch to the new secret.", "Renouveler le secret de signature ? Votre récepteur doit passer au nouveau secret.", "Rodar o segredo de assinatura? O seu recetor tem de passar ao novo segredo.", "¿Rotar el secreto de firma? Su receptor debe pasar al nuevo secreto."],
  "webhooks.delete": ["Delete", "Supprimer", "Eliminar", "Eliminar"],
  "webhooks.deleteConfirm": ["Delete this webhook and its delivery log?", "Supprimer ce webhook et son journal de livraison ?", "Eliminar este webhook e o seu registo de entregas?", "¿Eliminar este webhook y su registro de entregas?"],
  "webhooks.new": ["New webhook", "Nouveau webhook", "Novo webhook", "Nuevo webhook"],
  "webhooks.description": ["Description (optional)", "Description (facultatif)", "Descrição (opcional)", "Descripción (opcional)"],
  "webhooks.add": ["Add webhook", "Ajouter le webhook", "Adicionar webhook", "Añadir webhook"],
  "webhooks.showLog": ["Show delivery log", "Afficher le journal de livraison", "Mostrar registo de entregas", "Mostrar registro de entregas"],
  "webhooks.hideLog": ["Hide delivery log", "Masquer le journal de livraison", "Ocultar registo de entregas", "Ocultar registro de entregas"],
  "webhooks.noDeliveries": ["No deliveries yet.", "Aucune livraison pour l'instant.", "Ainda sem entregas.", "Aún no hay entregas."],
  "webhooks.attempts": ["attempt(s)", "tentative(s)", "tentativa(s)", "intento(s)"],
  "webhooks.retry": ["Retry now", "Réessayer", "Tentar de novo", "Reintentar"],
};
["en", "fr", "pt", "es"].forEach((lng, i) => {
  const p = `src/locales/${lng}/common.json`;
  const raw = readFileSync(p, "utf8");
  const json = JSON.parse(raw);
  let added = 0;
  for (const [k, v] of Object.entries(K)) if (!(k in json)) { json[k] = v[i]; added++; }
  writeFileSync(p, JSON.stringify(json, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
  console.log(lng, "added", added);
});
