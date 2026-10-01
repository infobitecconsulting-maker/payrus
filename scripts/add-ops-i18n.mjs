// Merge-only: reconciliation / budgets / follow-ups / approval-chain keys for every locale.
import { readFileSync, writeFileSync } from "node:fs";
const K = {
  "modules.tabRecords": ["Records", "Enregistrements", "Registos", "Registros"],
  "modules.tabReconcile": ["Reconciliation", "Rapprochement", "Conciliação", "Conciliación"],
  "modules.tabBudgets": ["Budgets", "Budgets", "Orçamentos", "Presupuestos"],
  "modules.approvalRecorded": ["Approval recorded: {{have}} of {{need}}. More approvers are needed.", "Approbation enregistrée : {{have}} sur {{need}}. D'autres approbateurs sont nécessaires.", "Aprovação registada: {{have}} de {{need}}. São necessários mais aprovadores.", "Aprobación registrada: {{have}} de {{need}}. Se necesitan más aprobadores."],
  "modules.approvalProgress": ["Approvals: {{have}} of {{need}}", "Approbations : {{have}} sur {{need}}", "Aprovações: {{have}} de {{need}}", "Aprobaciones: {{have}} de {{need}}"],
  "recon.import": ["Import a bank statement", "Importer un relevé bancaire", "Importar um extrato bancário", "Importar un extracto bancario"],
  "recon.importHint": ["Paste CSV rows or load a file: date (YYYY-MM-DD), amount, description, reference. Money in is positive, money out negative. Re-importing the same line is ignored.", "Collez des lignes CSV ou chargez un fichier : date (AAAA-MM-JJ), montant, libellé, référence. Entrées positives, sorties négatives. Une ligne déjà importée est ignorée.", "Cole linhas CSV ou carregue um ficheiro: data (AAAA-MM-DD), montante, descrição, referência. Entradas positivas, saídas negativas. Uma linha já importada é ignorada.", "Pegue filas CSV o cargue un archivo: fecha (AAAA-MM-DD), importe, descripción, referencia. Entradas positivas, salidas negativas. Una línea ya importada se ignora."],
  "recon.noRows": ["No valid rows. Use: date (YYYY-MM-DD), amount, description, reference — money in is positive.", "Aucune ligne valide. Format : date (AAAA-MM-JJ), montant, libellé, référence — entrées positives.", "Nenhuma linha válida. Use: data (AAAA-MM-DD), montante, descrição, referência — entradas positivas.", "Ninguna fila válida. Use: fecha (AAAA-MM-DD), importe, descripción, referencia — entradas positivas."],
  "recon.imported": ["{{n}} line(s) imported, {{s}} skipped (duplicates or invalid)", "{{n}} ligne(s) importée(s), {{s}} ignorée(s) (doublons ou invalides)", "{{n}} linha(s) importada(s), {{s}} ignorada(s) (duplicadas ou inválidas)", "{{n}} línea(s) importada(s), {{s}} omitida(s) (duplicadas o inválidas)"],
  "recon.file": ["Load file", "Charger un fichier", "Carregar ficheiro", "Cargar archivo"],
  "recon.importBtn": ["Import lines", "Importer les lignes", "Importar linhas", "Importar líneas"],
  "recon.open": ["Unreconciled lines", "Lignes non rapprochées", "Linhas por conciliar", "Líneas sin conciliar"],
  "recon.openHint": ["A suggestion needs the exact amount, currency and direction; a reference or counterparty in the description raises the score.", "Une suggestion exige le montant, la devise et le sens exacts ; une référence ou une contrepartie dans le libellé augmente le score.", "Uma sugestão exige montante, moeda e sentido exatos; uma referência ou contraparte na descrição aumenta a pontuação.", "Una sugerencia exige importe, moneda y sentido exactos; una referencia o contraparte en la descripción sube la puntuación."],
  "recon.matchAll": ["Match all strong suggestions", "Rapprocher toutes les suggestions fortes", "Conciliar todas as sugestões fortes", "Conciliar todas las sugerencias fuertes"],
  "recon.none": ["Nothing to reconcile.", "Rien à rapprocher.", "Nada para conciliar.", "Nada que conciliar."],
  "recon.match": ["Match", "Rapprocher", "Conciliar", "Conciliar"],
  "recon.ignore": ["Ignore", "Ignorer", "Ignorar", "Ignorar"],
  "recon.matched": ["Reconciled — the record is settled (no wallet movement)", "Rapproché — l'enregistrement est réglé (aucun mouvement de portefeuille)", "Conciliado — o registo está liquidado (sem movimento de carteira)", "Conciliado — el registro está liquidado (sin movimiento de cartera)"],
  "recon.matchedMany": ["{{n}} line(s) reconciled", "{{n}} ligne(s) rapprochée(s)", "{{n}} linha(s) conciliada(s)", "{{n}} línea(s) conciliada(s)"],
  "recon.done": ["Reconciled and ignored", "Rapprochées et ignorées", "Conciliadas e ignoradas", "Conciliadas e ignoradas"],
  "budget.title": ["Budget vs actual", "Budget vs réalisé", "Orçamento vs real", "Presupuesto vs real"],
  "budget.hint": ["Spend is counted from settled outgoing records (payments, payroll, claims, disbursements…) in the period and currency.", "Les dépenses proviennent des enregistrements sortants réglés (paiements, paie, sinistres, décaissements…) sur la période et la devise.", "A despesa conta registos de saída liquidados (pagamentos, salários, sinistros, desembolsos…) no período e moeda.", "El gasto cuenta registros de salida liquidados (pagos, nómina, siniestros, desembolsos…) en el periodo y la moneda."],
  "budget.none": ["No budgets yet.", "Aucun budget pour l'instant.", "Ainda sem orçamentos.", "Aún no hay presupuestos."],
  "budget.new": ["New budget", "Nouveau budget", "Novo orçamento", "Nuevo presupuesto"],
  "budget.name": ["Name (e.g. Programme costs 2026)", "Nom (ex. Coûts du programme 2026)", "Nome (ex. Custos do programa 2026)", "Nombre (p. ej. Costes del programa 2026)"],
  "budget.allModules": ["All modules", "Tous les modules", "Todos os módulos", "Todos los módulos"],
  "budget.allKinds": ["All outgoing types", "Tous les types sortants", "Todos os tipos de saída", "Todos los tipos de salida"],
  "budget.amount": ["Amount", "Montant", "Montante", "Importe"],
  "budget.alert": ["Alert at %", "Alerte à %", "Alerta a %", "Alerta al %"],
  "budget.add": ["Add budget", "Ajouter le budget", "Adicionar orçamento", "Añadir presupuesto"],
  "budget.saved": ["Budget saved", "Budget enregistré", "Orçamento guardado", "Presupuesto guardado"],
  "budget.over": ["over budget", "budget dépassé", "orçamento excedido", "presupuesto superado"],
  "budget.warn": ["above the {{p}}% alert", "au-dessus de l'alerte de {{p}} %", "acima do alerta de {{p}}%", "por encima de la alerta del {{p}}%"],
  "budget.ok": ["on track", "dans la cible", "dentro do previsto", "dentro de lo previsto"],
  "ageing.title": ["Receivables ageing and follow-ups", "Balance âgée et relances", "Antiguidade de recebíveis e acompanhamento", "Antigüedad de cuentas por cobrar y seguimiento"],
  "ageing.hint": ["Follow-up ladder: reminder from 1 day late, second notice from 15 days, final notice from 45 days.", "Échelle de relance : rappel dès 1 jour de retard, deuxième avis dès 15 jours, mise en demeure dès 45 jours.", "Escada de acompanhamento: lembrete a partir de 1 dia, segundo aviso aos 15 dias, aviso final aos 45 dias.", "Escalera de seguimiento: recordatorio desde 1 día, segundo aviso a los 15 días, aviso final a los 45 días."],
  "ageing.invoices": ["invoice(s)", "facture(s)", "fatura(s)", "factura(s)"],
  "ageing.days": ["days overdue", "jours de retard", "dias em atraso", "días de retraso"],
  "ageing.done": ["sent", "envoyée(s)", "enviado(s)", "enviado(s)"],
  "ageing.send": ["Record follow-up", "Enregistrer la relance", "Registar acompanhamento", "Registrar seguimiento"],
  "ageing.sent": ["Follow-up recorded", "Relance enregistrée", "Acompanhamento registado", "Seguimiento registrado"],
  "policy.title": ["Approval chains and limits", "Chaînes d'approbation et plafonds", "Cadeias de aprovação e limites", "Cadenas de aprobación y límites"],
  "policy.hint": ["Require several different approvers above an amount, and cap what each approver may approve. The person who prepared a record can never approve it.", "Exigez plusieurs approbateurs différents au-delà d'un montant et plafonnez ce que chacun peut approuver. La personne qui a préparé un enregistrement ne peut jamais l'approuver.", "Exija vários aprovadores diferentes acima de um montante e limite o que cada um pode aprovar. Quem preparou um registo nunca o pode aprovar.", "Exija varios aprobadores distintos por encima de un importe y limite lo que cada uno puede aprobar. Quien preparó un registro nunca puede aprobarlo."],
  "policy.none": ["Default: one second approver above each type's threshold.", "Par défaut : un second approbateur au-delà du seuil de chaque type.", "Predefinição: um segundo aprovador acima do limiar de cada tipo.", "Por defecto: un segundo aprobador por encima del umbral de cada tipo."],
  "policy.approvers": ["approver(s)", "approbateur(s)", "aprovador(es)", "aprobador(es)"],
  "policy.every": ["Every approval type", "Tous les types soumis à approbation", "Todos os tipos sujeitos a aprovação", "Todos los tipos sujetos a aprobación"],
  "policy.min": ["From amount", "À partir du montant", "A partir do montante", "Desde el importe"],
  "policy.add": ["Save policy", "Enregistrer la politique", "Guardar política", "Guardar política"],
  "policy.saved": ["Policy saved", "Politique enregistrée", "Política guardada", "Política guardada"],
  "policy.limits": ["Approver limits", "Plafonds par approbateur", "Limites por aprovador", "Límites por aprobador"],
  "policy.upTo": ["up to", "jusqu'à", "até", "hasta"],
  "policy.who": ["Approver email or @username", "E-mail ou @identifiant de l'approbateur", "Email ou @utilizador do aprovador", "Correo o @usuario del aprobador"],
  "policy.max": ["Max amount", "Montant max", "Montante máx.", "Importe máx."],
  "policy.addLimit": ["Set limit", "Définir le plafond", "Definir limite", "Fijar límite"],
  "policy.noUser": ["No PayRus member found for that identifier", "Aucun membre PayRus trouvé pour cet identifiant", "Nenhum membro PayRus encontrado para esse identificador", "No se encontró ningún miembro PayRus con ese identificador"],
  "policy.limitSaved": ["Limit saved for {{name}}", "Plafond enregistré pour {{name}}", "Limite guardado para {{name}}", "Límite guardado para {{name}}"],
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
